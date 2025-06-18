import { PrismaClient } from '@prisma/client';
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
    topics.forEach(topic => {
      const tokens = topic.tokens; // 直接使用已经处理好的tokens

      // 使用滑动窗口构建状态转移表
      for (let i = 0; i < tokens.length - 1; i++) {
        const currentToken = tokens[i];
        const nextToken = tokens[i + 1];

        if (!this.transitionTable.has(currentToken)) {
          this.transitionTable.set(currentToken, new Map());
        }

        const transitions = this.transitionTable.get(currentToken)!;
        transitions.set(nextToken, (transitions.get(nextToken) || 0) + 1);
      }
    });
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
   * 根据概率分布选择下一个词
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
    if (!transitions || transitions.size === 0) {
      return null;
    }

    const total = Array.from(transitions.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const normalizedTransitions = new Map<string, number>();

    // 应用温度参数调整概率分布
    transitions.forEach((count, word) => {
      const probability = Math.pow(count / total, 1 / temperature);
      normalizedTransitions.set(word, probability);
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
  }

  /**
   * 从数据库加载已训练的模型
   */
  async loadFromDatabase(): Promise<void> {
    try {
      console.log('从数据库加载马尔科夫链模型...');

      // 清除现有模型
      this.clearModels();

      // 加载通用马尔科夫链
      const generalChains = await prisma.markovChain.findMany();

      generalChains.forEach(chain => {
        if (!this.transitionTable.has(chain.currentWord)) {
          this.transitionTable.set(chain.currentWord, new Map());
        }

        const nextWordMap = this.transitionTable.get(chain.currentWord)!;
        nextWordMap.set(chain.nextWord, chain.frequency);
      });

      // 加载专业特定马尔科夫链
      const majorChains = await prisma.majorMarkovChain.findMany();

      const majorChainMap = new Map<
        string,
        Array<{ currentWord: string; nextWord: string; frequency: number }>
      >();

      majorChains.forEach(chain => {
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
        `✅ 模型加载成功: 通用状态${this.transitionTable.size}个, 专业模型${this.majorSpecificChains.size}个`
      );
    } catch (error) {
      console.error('从数据库加载模型失败:', error);
      throw error;
    }
  }

  /**
   * 保存模型到数据库
   */
  async saveToDatabase(): Promise<void> {
    try {
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
        await prisma.markovChain.createMany({
          data: generalChainData,
        });
      }

      // 保存专业特定的马尔科夫链
      const majorChainData: Array<{
        major: string;
        currentWord: string;
        nextWord: string;
        frequency: number;
      }> = [];

      this.majorSpecificChains.forEach((chain, major) => {
        chain.transitionTable.forEach((nextWords, currentWord) => {
          nextWords.forEach((frequency, nextWord) => {
            majorChainData.push({
              major,
              currentWord,
              nextWord,
              frequency,
            });
          });
        });
      });

      if (majorChainData.length > 0) {
        await prisma.majorMarkovChain.createMany({
          data: majorChainData,
        });
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
    let attempts = 0;
    const maxAttempts = count * 3;

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
      }
    }

    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      try {
        const topic = this.generateSingle({
          majorId: major,
          temperature: 1.0,
        });

        // 质量检查
        if (topic && topic.length >= 6 && topic.length <= 50) {
          const processedTopic = textProcessor.batchProcess([topic])[0];
          if (
            processedTopic.quality >= qualityThreshold &&
            !results.includes(topic)
          ) {
            results.push(topic);
            console.log(
              `✓ 马尔科夫生成题目 ${results.length}: ${topic} (质量: ${processedTopic.quality.toFixed(2)})`
            );
          }
        }
      } catch (error) {
        console.warn('生成单个题目失败:', error);
      }
    }

    if (results.length === 0) {
      // 如果专业特定生成失败，回退到通用生成
      console.log('专业特定生成失败，回退到通用生成');
      try {
        const fallbackTopic = this.generateSingle({ temperature: 1.0 });
        if (fallbackTopic) {
          results.push(fallbackTopic);
        }
      } catch (error) {
        console.warn('通用生成也失败:', error);
      }
    }

    console.log(`马尔科夫生成完成: ${results.length}/${count} 个题目`);
    return results;
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

    return result.join('');
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
