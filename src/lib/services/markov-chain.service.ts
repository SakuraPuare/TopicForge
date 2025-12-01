import { PrismaClient, MarkovChain, MajorMarkovChain } from '@prisma/client';
import { textProcessor } from './text-processor.service';
import { ProcessedTopic } from '../interfaces/text-processing';
import {
  MarkovConfig,
  MajorSpecificChain,
  MarkovStats,
  GenerationOptions,
} from '../interfaces/markov';

const prisma = new PrismaClient();

/**
 * 马尔科夫链生成器服务类
 */
export class MarkovChainService {
  private transitionTable: Map<string, Map<string, number>> = new Map();
  private majorSpecificChains: Map<string, MajorSpecificChain> = new Map();
  private config: MarkovConfig;

  // 动态专业词汇缓存
  private majorStartTokensCache: Map<string, string[]> = new Map();
  private majorEndTokensCache: Map<string, string[]> = new Map();

  // 词汇表（用于 Laplace 平滑）
  private vocabulary: Set<string> = new Set();

  // 高频词缓存（用于 OOV 回退）
  private highFrequencyWords: string[] = [];

  // Laplace 平滑参数
  private readonly SMOOTHING_ALPHA = 0.1;

  // 通用开始和结束词汇
  private readonly START_TOKENS = [
    '基于',
    '关于',
    '面向',
    '智能',
    '自动',
    '数字化',
    '网络',
    '移动',
    '云',
    '大数据',
    '人工智能',
    '机器学习',
    '深度学习',
    '计算机',
    '软件',
    '系统',
    '平台',
    '算法',
  ];

  private readonly END_TOKENS = [
    '系统',
    '平台',
    '算法',
    '方法',
    '技术',
    '应用',
    '研究',
    '分析',
    '设计',
    '实现',
    '管理系统',
    '检测系统',
    '识别算法',
    '优化方法',
    '分析平台',
    '管理平台',
  ];

  constructor(config: Partial<MarkovConfig> = {}) {
    this.config = {
      order: 2,
      maxLength: 25,
      minLength: 6,
      startTokens: this.START_TOKENS,
      endTokens: this.END_TOKENS,
      majorSpecific: false,
      ...config,
    };
  }

  /**
   * 训练马尔科夫链模型
   * @param topics 处理过的主题数据
   */
  async train(topics: (ProcessedTopic & { major?: string })[]): Promise<void> {
    console.log(`开始训练马尔科夫链模型，共 ${topics.length} 个样本`);

    // 重置模型
    this.clearModels();

    if (topics.length === 0) {
      console.warn('没有训练数据，跳过马尔科夫链训练');
      return;
    }

    // 按专业分组
    const topicsByMajor = this.groupTopicsByMajor(topics);

    // 训练通用模型
    console.log('训练通用马尔科夫链模型...');
    this.trainGeneralModel(topics);

    // 训练专业特定模型
    console.log('训练专业特定马尔科夫链模型...');
    await this.trainMajorSpecificModels(topicsByMajor);

    console.log('马尔科夫链模型训练完成');
    console.log(`- 通用模型状态数: ${this.transitionTable.size}`);
    console.log(`- 专业特定模型数: ${this.majorSpecificChains.size}`);

    // 输出各专业模型统计
    this.majorSpecificChains.forEach((chain, major) => {
      console.log(`  - ${major}: ${chain.transitionTable.size} 个状态`);
    });
  }

  /**
   * 清空现有模型
   */
  private clearModels(): void {
    this.transitionTable.clear();
    this.majorSpecificChains.clear();
    this.vocabulary.clear();
    this.highFrequencyWords = [];
  }

  /**
   * 按专业分组
   * @param topics 题目数组
   * @returns 按专业分组的映射
   */
  private groupTopicsByMajor(
    topics: (ProcessedTopic & { major?: string })[]
  ): Map<string, (ProcessedTopic & { major?: string })[]> {
    const groups = new Map<string, (ProcessedTopic & { major?: string })[]>();

    topics.forEach(topic => {
      const major = topic.major || '未分类';
      if (!groups.has(major)) {
        groups.set(major, []);
      }
      groups.get(major)!.push(topic);
    });

    return groups;
  }

  /**
   * 训练通用模型
   * @param topics 训练数据
   */
  private trainGeneralModel(topics: ProcessedTopic[]): void {
    // 词频统计，用于构建高频词列表
    const wordFrequency = new Map<string, number>();

    topics.forEach(topic => {
      const tokens = topic.tokens; // 直接使用已经处理好的tokens

      // 使用滑动窗口构建状态转移表
      for (let i = 0; i < tokens.length - 1; i++) {
        const currentToken = tokens[i];
        const nextToken = tokens[i + 1];

        // 构建词汇表
        this.vocabulary.add(currentToken);
        this.vocabulary.add(nextToken);

        // 统计词频
        wordFrequency.set(
          currentToken,
          (wordFrequency.get(currentToken) || 0) + 1
        );
        wordFrequency.set(nextToken, (wordFrequency.get(nextToken) || 0) + 1);

        if (!this.transitionTable.has(currentToken)) {
          this.transitionTable.set(currentToken, new Map());
        }

        const transitions = this.transitionTable.get(currentToken)!;
        transitions.set(nextToken, (transitions.get(nextToken) || 0) + 1);
      }
    });

    // 构建高频词列表（取前100个高频词）
    this.highFrequencyWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([word]) => word);

    console.log(
      `词汇表大小: ${this.vocabulary.size}, 高频词数量: ${this.highFrequencyWords.length}`
    );
  }

  /**
   * 训练专业特定模型
   * @param topicsByMajor 按专业分组的训练数据
   */
  private async trainMajorSpecificModels(
    topicsByMajor: Map<string, ProcessedTopic[]>
  ): Promise<void> {
    for (const [major, topics] of topicsByMajor.entries()) {
      if (!this.majorSpecificChains.has(major)) {
        this.majorSpecificChains.set(major, {
          transitionTable: new Map(),
          startTokens: new Set(),
          endTokens: new Set(),
        });
      }

      const chain = this.majorSpecificChains.get(major)!;

      topics.forEach(topic => {
        const tokens = topic.tokens; // 直接使用已经处理好的tokens

        // 记录开始和结束词
        if (tokens.length > 0) {
          chain.startTokens.add(tokens[0]);
          chain.endTokens.add(tokens[tokens.length - 1]);
        }

        // 构建专业特定的状态转移表
        for (let i = 0; i < tokens.length - 1; i++) {
          const currentToken = tokens[i];
          const nextToken = tokens[i + 1];

          if (!chain.transitionTable.has(currentToken)) {
            chain.transitionTable.set(currentToken, new Map());
          }

          const transitions = chain.transitionTable.get(currentToken)!;
          transitions.set(nextToken, (transitions.get(nextToken) || 0) + 1);
        }
      });
    }
  }

  /**
   * 计算质量统计
   * @param topics 题目数组
   * @returns 质量统计
   */
  private calculateQualityStats(topics: ProcessedTopic[]): {
    high: number;
    medium: number;
    low: number;
  } {
    let high = 0,
      medium = 0,
      low = 0;

    topics.forEach(topic => {
      if (topic.quality >= 0.6) high++;
      else if (topic.quality >= 0.3) medium++;
      else low++;
    });

    return { high, medium, low };
  }

  /**
   * 基于指定转移表训练tokens
   * @param tokens 分词结果
   * @param table 转移表
   */
  private trainOnTokens(
    tokens: string[],
    table: Map<string, Map<string, number>>
  ): void {
    const paddedTokens = ['<START>', ...tokens, '<END>'];

    for (let i = 0; i <= paddedTokens.length - this.config.order - 1; i++) {
      const currentState = paddedTokens.slice(i, i + this.config.order);
      const nextToken = paddedTokens[i + this.config.order];

      const stateKey = currentState.join('|');

      if (!table.has(stateKey)) {
        table.set(stateKey, new Map());
      }

      const nextTokenMap = table.get(stateKey)!;
      nextTokenMap.set(nextToken, (nextTokenMap.get(nextToken) || 0) + 1);
    }
  }

  /**
   * 获取随机起始词
   * @param majorId 专业ID
   * @returns 起始词
   */
  private getRandomStartWord(majorId?: string): string {
    const chain = majorId ? this.majorSpecificChains.get(majorId) : null;
    const startTokens = chain?.startTokens || new Set(this.config.startTokens);

    const tokens = Array.from(startTokens);
    if (tokens.length === 0) {
      throw new Error('没有可用的起始词');
    }

    return tokens[Math.floor(Math.random() * tokens.length)];
  }

  /**
   * 判断是否为结束词
   * @param word 待判断的词
   * @param majorId 专业ID
   * @returns 是否为结束词
   */
  private isEndWord(word: string, majorId?: string): boolean {
    const chain = majorId ? this.majorSpecificChains.get(majorId) : null;
    const endTokens = chain?.endTokens || new Set(this.config.endTokens);
    return endTokens.has(word);
  }

  /**
   * 获取随机高频词（用于 OOV 回退）
   * @returns 随机高频词
   */
  private getRandomHighFrequencyWord(): string | null {
    if (this.highFrequencyWords.length === 0) {
      return null;
    }
    return this.highFrequencyWords[
      Math.floor(Math.random() * Math.min(20, this.highFrequencyWords.length))
    ];
  }

  /**
   * 根据概率分布选择下一个词（带 Laplace 平滑和 OOV 回退）
   * @param currentWord 当前词
   * @param temperature 温度参数
   * @param transitionTable 状态转移表
   * @returns 下一个词
   */
  private getNextWord(
    currentWord: string,
    temperature: number,
    transitionTable: Map<string, Map<string, number>>
  ): string | null {
    const transitions = transitionTable.get(currentWord);

    // OOV 回退策略：如果当前词没有转移记录，使用高频词
    if (!transitions || transitions.size === 0) {
      return this.getRandomHighFrequencyWord();
    }

    // 计算原始总频次
    const total = Array.from(transitions.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // 词汇表大小（用于 Laplace 平滑）
    const vocabSize = Math.max(this.vocabulary.size, 1000);
    const alpha = this.SMOOTHING_ALPHA;

    const normalizedTransitions = new Map<string, number>();

    // 应用 Laplace 平滑和温度参数
    transitions.forEach((count, word) => {
      // Laplace 平滑: P(w) = (count + alpha) / (total + alpha * V)
      const smoothedProb = (count + alpha) / (total + alpha * vocabSize);
      // 应用温度参数
      const adjustedProb = Math.pow(smoothedProb, 1 / temperature);
      normalizedTransitions.set(word, adjustedProb);
    });

    const totalProbability = Array.from(normalizedTransitions.values()).reduce(
      (sum, prob) => sum + prob,
      0
    );

    let random = Math.random() * totalProbability;

    for (const [word, probability] of normalizedTransitions.entries()) {
      random -= probability;
      if (random <= 0) {
        return word;
      }
    }

    return Array.from(transitions.keys())[0];
  }

  /**
   * 清空模型数据
   */
  clear(): void {
    this.transitionTable.clear();
    this.majorSpecificChains.clear();
    this.vocabulary.clear();
    this.highFrequencyWords = [];
  }

  /**
   * 从数据库加载已训练的模型
   */
  async loadFromDatabase(): Promise<void> {
    try {
      console.log('从数据库加载马尔科夫链模型...');

      // 清除现有模型
      this.clearModels();

      // 用于重建词汇表和词频统计
      const wordFrequency = new Map<string, number>();

      // 加载通用马尔科夫链
      const generalChains = await prisma.markovChain.findMany();

      generalChains.forEach((chain: MarkovChain) => {
        if (!this.transitionTable.has(chain.currentWord)) {
          this.transitionTable.set(chain.currentWord, new Map());
        }

        const nextWordMap = this.transitionTable.get(chain.currentWord)!;
        nextWordMap.set(chain.nextWord, chain.frequency);

        // 重建词汇表和词频
        this.vocabulary.add(chain.currentWord);
        this.vocabulary.add(chain.nextWord);
        wordFrequency.set(
          chain.currentWord,
          (wordFrequency.get(chain.currentWord) || 0) + chain.frequency
        );
        wordFrequency.set(
          chain.nextWord,
          (wordFrequency.get(chain.nextWord) || 0) + chain.frequency
        );
      });

      // 重建高频词列表
      this.highFrequencyWords = Array.from(wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([word]) => word);

      // 加载专业特定马尔科夫链
      const majorChains = await prisma.majorMarkovChain.findMany();

      const majorChainMap = new Map<
        string,
        Array<{ currentWord: string; nextWord: string; frequency: number }>
      >();

      majorChains.forEach((chain: MajorMarkovChain) => {
        if (!majorChainMap.has(chain.major)) {
          majorChainMap.set(chain.major, []);
        }
        majorChainMap.get(chain.major)!.push({
          currentWord: chain.currentWord,
          nextWord: chain.nextWord,
          frequency: chain.frequency,
        });
      });

      // 构建专业特定链
      majorChainMap.forEach((chains, major) => {
        const transitionTable = new Map<string, Map<string, number>>();

        chains.forEach(chain => {
          if (!transitionTable.has(chain.currentWord)) {
            transitionTable.set(chain.currentWord, new Map());
          }

          const nextWordMap = transitionTable.get(chain.currentWord)!;
          nextWordMap.set(chain.nextWord, chain.frequency);
        });

        this.majorSpecificChains.set(major, {
          transitionTable,
          startTokens: new Set(this.START_TOKENS),
          endTokens: new Set(this.END_TOKENS),
        });
      });

      console.log(
        `✅ 模型加载成功: 通用状态${this.transitionTable.size}个, 专业模型${this.majorSpecificChains.size}个, 词汇表${this.vocabulary.size}个`
      );
    } catch (error) {
      console.error('从数据库加载模型失败:', error);
      throw error;
    }
  }

  /**
   * 保存模型到数据库（批量操作优化版）
   */
  async saveToDatabase(): Promise<void> {
    const BATCH_SIZE = 1000; // 每批处理1000条记录

    try {
      console.log('开始保存马尔科夫链模型到数据库...');

      // 清空现有数据
      await prisma.markovChain.deleteMany();
      await prisma.majorMarkovChain.deleteMany();

      // 保存通用马尔科夫链
      const generalChainData: Array<{
        currentWord: string;
        nextWord: string;
        frequency: number;
      }> = [];

      this.transitionTable.forEach((nextWords, currentWord) => {
        nextWords.forEach((frequency, nextWord) => {
          generalChainData.push({
            currentWord,
            nextWord,
            frequency,
          });
        });
      });

      if (generalChainData.length > 0) {
        console.log(
          `批量保存 ${generalChainData.length} 条通用马尔科夫链数据...`
        );

        // 批量插入（已通过 Map 去重，无需 skipDuplicates）
        for (let i = 0; i < generalChainData.length; i += BATCH_SIZE) {
          const batch = generalChainData.slice(i, i + BATCH_SIZE);
          await prisma.markovChain.createMany({
            data: batch,
          });

          const progress = Math.min(i + BATCH_SIZE, generalChainData.length);
          if (generalChainData.length > BATCH_SIZE) {
            console.log(
              `  通用链进度: ${progress}/${generalChainData.length} (${((progress / generalChainData.length) * 100).toFixed(1)}%)`
            );
          }
        }
      }

      // 保存专业特定的马尔科夫链
      const majorChainData: Array<{
        major: string;
        currentWord: string;
        nextWord: string;
        frequency: number;
      }> = [];

      // 使用 Map 去重，以防止内存中的重复数据
      const uniqueMajorChains = new Map<
        string,
        {
          major: string;
          currentWord: string;
          nextWord: string;
          frequency: number;
        }
      >();

      this.majorSpecificChains.forEach((chain, major) => {
        chain.transitionTable.forEach((nextWords, currentWord) => {
          nextWords.forEach((frequency, nextWord) => {
            const key = `${major}:${currentWord}:${nextWord}`;
            const existing = uniqueMajorChains.get(key);

            if (existing) {
              // 如果已存在，累加频率
              existing.frequency += frequency;
            } else {
              uniqueMajorChains.set(key, {
                major,
                currentWord,
                nextWord,
                frequency,
              });
            }
          });
        });
      });

      // 转换为数组
      majorChainData.push(...uniqueMajorChains.values());

      if (majorChainData.length > 0) {
        console.log(
          `批量保存 ${majorChainData.length} 条专业特定马尔科夫链数据...`
        );

        // 批量插入（已通过 Map 去重，无需 skipDuplicates）
        for (let i = 0; i < majorChainData.length; i += BATCH_SIZE) {
          const batch = majorChainData.slice(i, i + BATCH_SIZE);
          await prisma.majorMarkovChain.createMany({
            data: batch,
          });

          const progress = Math.min(i + BATCH_SIZE, majorChainData.length);
          if (majorChainData.length > BATCH_SIZE) {
            console.log(
              `  专业链进度: ${progress}/${majorChainData.length} (${((progress / majorChainData.length) * 100).toFixed(1)}%)`
            );
          }
        }
      }

      console.log(
        `✅ 模型保存到数据库成功: 通用状态${generalChainData.length}个, 专业特定状态${majorChainData.length}个`
      );
    } catch (error) {
      console.error('保存模型到数据库失败:', error);
      throw error;
    }
  }

  /**
   * 生成多个主题（修复接口匹配问题）
   * @param options 生成选项
   * @returns 生成的主题数组
   */
  async generate(options: Partial<GenerationOptions> = {}): Promise<string[]> {
    const { count = 5, major, qualityThreshold = 0.15 } = options;
    const results: string[] = [];

    // 确保有可用的转移表
    if (
      this.transitionTable.size === 0 &&
      this.majorSpecificChains.size === 0
    ) {
      // 尝试从数据库加载
      try {
        await this.loadFromDatabase();
      } catch (error) {
        console.warn('无法加载模型:', error);
        return []; // 直接返回空数组，避免无效尝试
      }
    }

    // 批量生成，减少单个生成的开销
    const batchSize = Math.min(count * 3, 30); // 生成目标数量的3倍，但不超过30个
    const candidates: string[] = [];

    for (let i = 0; i < batchSize && candidates.length < count * 3; i++) {
      try {
        const topic = this.generateSingle({
          majorId: major,
          temperature: 1.0,
        });

        // 使用验证方法检查生成的题目质量
        if (
          topic &&
          this.validateGeneratedTopic(topic) &&
          !candidates.includes(topic)
        ) {
          candidates.push(topic);
        }
      } catch {
        // 忽略单个生成失败
        continue;
      }
    }

    // 批量质量检查（只对候选题目进行）
    if (candidates.length > 0) {
      const processedTopics = textProcessor.batchProcess(candidates);

      for (
        let i = 0;
        i < processedTopics.length && results.length < count;
        i++
      ) {
        const processed = processedTopics[i];
        if (processed.quality >= qualityThreshold) {
          results.push(candidates[i]);
          console.log(
            `✓ 马尔科夫生成题目 ${results.length}: ${candidates[i]} (质量: ${processed.quality.toFixed(2)})`
          );
        }
      }
    }

    // 如果结果不够，进行回退生成（使用降低的质量阈值）
    if (results.length < count) {
      console.log(`需要补充 ${count - results.length} 个题目`);
      // 回退阈值为原阈值的80%，但不低于0.3
      const fallbackThreshold = Math.max(qualityThreshold * 0.8, 0.3);

      for (let i = 0; results.length < count && i < 20; i++) {
        try {
          const fallbackTopic = this.generateSingle({
            temperature: 1.1, // 稍微提高随机性
            majorId: major,
          });

          // 使用验证方法检查
          if (
            fallbackTopic &&
            this.validateGeneratedTopic(fallbackTopic) &&
            !results.includes(fallbackTopic)
          ) {
            // 回退生成也进行质量检查，但使用降低的阈值
            const processedFallback = textProcessor.batchProcess([
              fallbackTopic,
            ])[0];
            if (processedFallback.quality >= fallbackThreshold) {
              results.push(fallbackTopic);
              console.log(
                `✓ 回退生成题目 ${results.length}: ${fallbackTopic} (质量: ${processedFallback.quality.toFixed(2)})`
              );
            }
          }
        } catch {
          continue;
        }
      }
    }

    console.log(`马尔科夫生成完成: ${results.length}/${count} 个题目`);
    return results;
  }

  /**
   * 智能拼接词汇
   * - 中文之间不加空格
   * - 英文之间加空格
   * - 中英混合时根据情况处理
   */
  private smartJoin(tokens: string[]): string {
    if (tokens.length === 0) return '';

    let result = tokens[0];
    for (let i = 1; i < tokens.length; i++) {
      const prev = tokens[i - 1];
      const curr = tokens[i];

      const prevIsEnglish = /^[a-zA-Z0-9]+$/.test(prev);
      const currIsEnglish = /^[a-zA-Z0-9]+$/.test(curr);

      // 英文之间需要空格
      if (prevIsEnglish && currIsEnglish) {
        result += ' ' + curr;
      } else {
        result += curr;
      }
    }

    return result;
  }

  /**
   * 验证生成的题目质量
   */
  private validateGeneratedTopic(topic: string): boolean {
    // 1. 长度检查
    if (topic.length < 8 || topic.length > 50) return false;

    // 2. 必须包含中文
    const chineseChars = (topic.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseChars < 4) return false;

    // 3. 中文字符占比应该 > 50%
    const totalChars = topic.replace(/\s/g, '').length;
    if (chineseChars / totalChars < 0.5) return false;

    // 4. 不能包含连续的长英文字符串（超过15个字母说明分词有问题）
    if (/[a-zA-Z]{15,}/.test(topic)) return false;

    return true;
  }

  /**
   * 生成单个主题的内部方法
   * @param options 生成选项
   * @returns 生成的主题
   */
  private generateSingle(
    options: {
      startWord?: string;
      temperature?: number;
      majorId?: string;
    } = {}
  ): string {
    const { startWord, temperature = 1.0, majorId } = options;

    // 使用专业特定的模型（如果有）
    const chain = majorId ? this.majorSpecificChains.get(majorId) : null;
    const transitionTable = chain?.transitionTable || this.transitionTable;

    if (transitionTable.size === 0) {
      throw new Error('模型未经过训练');
    }

    let currentWord = startWord || this.getRandomStartWord(majorId);
    const result: string[] = [currentWord];

    while (result.length < this.config.maxLength) {
      const nextWord = this.getNextWord(
        currentWord,
        temperature,
        transitionTable
      );

      if (!nextWord || this.isEndWord(nextWord, majorId)) {
        break;
      }

      result.push(nextWord);
      currentWord = nextWord;

      if (result.length >= this.config.minLength && Math.random() < 0.2) {
        break;
      }
    }

    // 使用智能拼接
    return this.smartJoin(result);
  }

  /**
   * 获取统计信息
   * @returns 马尔科夫链统计信息
   */
  getStats(): MarkovStats {
    const stateCount = this.transitionTable.size;

    // 计算总转移次数
    let totalTransitions = 0;
    const vocabulary = new Set<string>();

    this.transitionTable.forEach((nextWords, currentWord) => {
      vocabulary.add(currentWord);
      nextWords.forEach((frequency, nextWord) => {
        vocabulary.add(nextWord);
        totalTransitions += frequency;
      });
    });

    const averageTransitionsPerState =
      stateCount > 0 ? totalTransitions / stateCount : 0;

    const majorSpecificStats = new Map<string, { stateCount: number }>();
    this.majorSpecificChains.forEach((chain, major) => {
      majorSpecificStats.set(major, {
        stateCount: chain.transitionTable.size,
      });
    });

    return {
      stateCount,
      totalTransitions,
      averageTransitionsPerState,
      vocabulary: Array.from(vocabulary),
      generalStateCount: stateCount,
      majorSpecificStats: Object.fromEntries(majorSpecificStats),
    };
  }
}

// 导出单例实例
export const markovChainService = new MarkovChainService();
