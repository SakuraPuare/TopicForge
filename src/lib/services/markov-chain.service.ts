import { PrismaClient, MarkovChain, MajorMarkovChain } from '@prisma/client';
import { textProcessor } from './text-processor.service';
import { semanticValidator } from './semantic-validator.service';
import { ProcessedTopic } from '../interfaces/text-processing';
import {
  MarkovConfig,
  MajorSpecificChain,
  MarkovStats,
  GenerationOptions,
} from '../interfaces/markov';

const prisma = new PrismaClient();

// 预计算模型信息接口
interface PrecomputedModelInfo {
  scope: string;
  name: string;
  startTokens: string[];
  endTokens: string[];
  highFreqWords: string[];
  sampleCount: number;
  stateCount: number;
  fallbackTo: string | null;
  isReady: boolean;
}

// 生成配置接口
interface GenerationConfigMap {
  majorMinSamples: number;
  categoryMinSamples: number;
  qualityThreshold: number;
  lowSampleQualityPenalty: number;
}

/**
 * 马尔科夫链生成器服务类
 */
export class MarkovChainService {
  private transitionTable: Map<string, Map<string, number>> = new Map(); // 一阶转移表
  private ngramTransitionTable: Map<string, Map<string, number>> = new Map(); // N-gram 转移表（二阶）
  private majorSpecificChains: Map<string, MajorSpecificChain> = new Map();
  private categoryChains: Map<string, MajorSpecificChain> = new Map(); // 类别模型
  private config: MarkovConfig;

  // 从数据库加载的专业类别映射（替代硬编码）
  private majorCategories: Map<string, string> = new Map();

  // 预计算模型缓存
  private precomputedModels: Map<string, PrecomputedModelInfo> = new Map();
  private generalModel: PrecomputedModelInfo | null = null;
  private categoryModels: Map<string, PrecomputedModelInfo> = new Map();

  // 生成配置
  private generationConfig: GenerationConfigMap = {
    majorMinSamples: 50,
    categoryMinSamples: 30,
    qualityThreshold: 0.5,
    lowSampleQualityPenalty: 0.8,
  };

  // 动态专业词汇缓存
  private majorStartTokensCache: Map<string, string[]> = new Map();
  private majorEndTokensCache: Map<string, string[]> = new Map();

  // 词汇表（用于 Laplace 平滑）
  private vocabulary: Set<string> = new Set();

  // 高频词缓存（用于 OOV 回退）
  private highFrequencyWords: string[] = [];

  // 最后一次生成使用的模型信息
  private lastUsedModelInfo: {
    modelType: 'major' | 'category' | 'general';
    modelName: string;
    qualityFactor: number;
    originalMajor?: string;
  } | null = null;

  // Laplace 平滑参数
  private readonly SMOOTHING_ALPHA = 0.1;

  // 默认开始和结束词汇（仅作为回退，优先使用数据库中的预计算数据）
  private defaultStartTokens: string[] = [
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

  private defaultEndTokens: string[] = [
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
      startTokens: this.defaultStartTokens,
      endTokens: this.defaultEndTokens,
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

    // 训练类别模型
    console.log('训练类别马尔科夫链模型...');
    await this.trainCategoryModels(topics);

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
    this.ngramTransitionTable.clear();
    this.majorSpecificChains.clear();
    this.categoryChains.clear();
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

      // 构建一阶转移表（用于回退）
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

      // 构建 N-gram 转移表（二阶，order=2）
      if (this.config.order >= 2 && tokens.length >= 2) {
        for (let i = 0; i < tokens.length - 2; i++) {
          // 构建状态键：使用 | 分隔的前 N-1 个词
          const stateKey = `${tokens[i]}|${tokens[i + 1]}`;
          const nextToken = tokens[i + 2];

          if (!this.ngramTransitionTable.has(stateKey)) {
            this.ngramTransitionTable.set(stateKey, new Map());
          }

          const ngramTransitions = this.ngramTransitionTable.get(stateKey)!;
          ngramTransitions.set(
            nextToken,
            (ngramTransitions.get(nextToken) || 0) + 1
          );
        }
      }
    });

    // 构建高频词列表（取前100个高频词）
    this.highFrequencyWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([word]) => word);

    console.log(
      `词汇表大小: ${this.vocabulary.size}, 高频词数量: ${this.highFrequencyWords.length}, ` +
        `一阶状态数: ${this.transitionTable.size}, 二阶状态数: ${this.ngramTransitionTable.size}`
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
   * 训练类别模型
   * @param topics 训练数据
   */
  private async trainCategoryModels(
    topics: (ProcessedTopic & { major?: string })[]
  ): Promise<void> {
    // 按类别分组
    const topicsByCategory = new Map<string, ProcessedTopic[]>();

    topics.forEach(topic => {
      if (!topic.major) return;

      const category = this.getCategoryForMajor(topic.major);
      if (!category) return;

      if (!topicsByCategory.has(category)) {
        topicsByCategory.set(category, []);
      }
      topicsByCategory.get(category)!.push(topic);
    });

    // 只为有足够样本的类别训练模型（至少30个样本）
    const MIN_SAMPLES_FOR_CATEGORY = 30;

    for (const [category, categoryTopics] of topicsByCategory.entries()) {
      if (categoryTopics.length < MIN_SAMPLES_FOR_CATEGORY) {
        continue;
      }

      if (!this.categoryChains.has(category)) {
        this.categoryChains.set(category, {
          transitionTable: new Map(),
          startTokens: new Set(),
          endTokens: new Set(),
        });
      }

      const chain = this.categoryChains.get(category)!;

      categoryTopics.forEach(topic => {
        const tokens = topic.tokens;

        // 记录开始和结束词
        if (tokens.length > 0) {
          chain.startTokens.add(tokens[0]);
          chain.endTokens.add(tokens[tokens.length - 1]);
        }

        // 构建类别特定的状态转移表
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

      console.log(
        `  类别 "${category}": ${categoryTopics.length} 个样本, ${chain.transitionTable.size} 个状态`
      );
    }
  }

  /**
   * 获取专业所属类别（从数据库加载的映射中获取）
   * @param major 专业名称
   * @returns 类别名称，如果没有则返回 null
   */
  private getCategoryForMajor(major: string): string | null {
    return this.majorCategories.get(major) || null;
  }

  /**
   * 根据专业获取合适的模型（使用预计算的回退路径）
   * @param major 专业名称
   * @returns 转移表、模型类型和质量因子
   */
  private getModelForMajor(major?: string): {
    transitionTable: Map<string, Map<string, number>>;
    modelType: 'major' | 'category' | 'general';
    qualityFactor: number;
  } {
    if (major) {
      // 查找预计算的专业模型
      const majorModel = this.precomputedModels.get(`major:${major}`);

      if (majorModel?.isReady) {
        // 专业模型可用，使用专业特定的转移表
        const majorChain = this.majorSpecificChains.get(major);
        if (majorChain && majorChain.transitionTable.size > 0) {
          return {
            transitionTable: majorChain.transitionTable,
            modelType: 'major',
            qualityFactor: 1.0,
          };
        }
      }

      // 使用预计算的回退路径
      if (majorModel?.fallbackTo) {
        if (majorModel.fallbackTo !== '_global') {
          // 回退到类别模型
          const categoryModel = this.categoryModels.get(majorModel.fallbackTo);
          if (categoryModel?.isReady) {
            const categoryChain = this.categoryChains.get(
              majorModel.fallbackTo
            );
            if (categoryChain && categoryChain.transitionTable.size > 0) {
              return {
                transitionTable: categoryChain.transitionTable,
                modelType: 'category',
                qualityFactor: this.generationConfig.lowSampleQualityPenalty,
              };
            }
          }
        }
      }

      // 兼容旧逻辑：如果没有预计算数据，尝试使用类别映射
      const category = this.getCategoryForMajor(major);
      if (category) {
        const categoryChain = this.categoryChains.get(category);
        if (categoryChain && categoryChain.transitionTable.size >= 30) {
          return {
            transitionTable: categoryChain.transitionTable,
            modelType: 'category',
            qualityFactor: this.generationConfig.lowSampleQualityPenalty,
          };
        }
      }
    }

    // 回退到通用模型
    return {
      transitionTable: this.transitionTable,
      modelType: 'general',
      qualityFactor: major
        ? this.generationConfig.lowSampleQualityPenalty
        : 1.0,
    };
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
   * 加权随机选择
   * @param candidates 候选项数组，每项包含 word 和 weight
   * @returns 选中的词
   */
  private weightedRandomSelect(
    candidates: Array<{ word: string; weight: number }>
  ): string {
    if (candidates.length === 0) {
      throw new Error('没有候选项');
    }

    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;

    for (const candidate of candidates) {
      random -= candidate.weight;
      if (random <= 0) {
        return candidate.word;
      }
    }

    return candidates[candidates.length - 1].word;
  }

  /**
   * 获取随机起始词
   * @param majorId 专业ID
   * @param preferredKeywords 偏好关键词
   * @returns 起始词
   */
  private getRandomStartWord(
    majorId?: string,
    preferredKeywords?: string[]
  ): string {
    let tokens: string[] = [];

    // 使用分层回退机制获取起始词候选
    if (majorId) {
      // 1. 尝试专业特定模型
      const majorChain = this.majorSpecificChains.get(majorId);
      if (majorChain && majorChain.startTokens.size > 0) {
        tokens = Array.from(majorChain.startTokens);
      }

      // 2. 如果专业模型没有，尝试类别模型
      if (tokens.length === 0) {
        const category = this.getCategoryForMajor(majorId);
        if (category) {
          const categoryChain = this.categoryChains.get(category);
          if (categoryChain && categoryChain.startTokens.size > 0) {
            tokens = Array.from(categoryChain.startTokens);
          }
        }
      }
    }

    // 3. 回退到通用起始词
    if (tokens.length === 0) {
      tokens = Array.from(this.config.startTokens);
    }

    if (tokens.length === 0) {
      throw new Error('没有可用的起始词');
    }

    // 如果有偏好关键词，使用加权选择
    if (preferredKeywords && preferredKeywords.length > 0) {
      const weighted = tokens.map(word => ({
        word,
        // 如果起始词包含偏好关键词，权重提高3倍
        weight: preferredKeywords.some(kw => word.includes(kw)) ? 3.0 : 1.0,
      }));
      return this.weightedRandomSelect(weighted);
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
    // 使用分层回退机制检查结束词
    if (majorId) {
      // 1. 尝试专业特定模型
      const majorChain = this.majorSpecificChains.get(majorId);
      if (majorChain && majorChain.endTokens.has(word)) {
        return true;
      }

      // 2. 尝试类别模型
      const category = this.getCategoryForMajor(majorId);
      if (category) {
        const categoryChain = this.categoryChains.get(category);
        if (categoryChain && categoryChain.endTokens.has(word)) {
          return true;
        }
      }
    }

    // 3. 回退到通用结束词
    return this.config.endTokens.includes(word);
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
   * 根据 N-gram 上下文获取下一个词（带回退机制和重复词过滤）
   * @param context 上下文数组（最近的 N-1 个词）
   * @param temperature 温度参数
   * @param transitionTable 一阶转移表（用于回退）
   * @param ngramTransitionTable N-gram 转移表
   * @param usedWords 已使用的词汇集合
   * @param usedBigrams 已使用的二元组集合
   * @param result 当前生成的结果数组（用于检测 A-B-A 模式）
   * @param preferredKeywords 偏好关键词（可选）
   * @returns 下一个词
   */
  private getNextWordNGramFiltered(
    context: string[],
    temperature: number,
    transitionTable: Map<string, Map<string, number>>,
    ngramTransitionTable: Map<string, Map<string, number>>,
    usedWords: Set<string>,
    usedBigrams: Set<string>,
    result: string[],
    preferredKeywords?: string[]
  ): string | null {
    const currentWord = context[context.length - 1];
    let transitions: Map<string, number> | undefined;

    // 如果上下文长度足够，尝试使用 N-gram（二阶）
    if (context.length >= 2 && this.config.order >= 2) {
      const stateKey = `${context[context.length - 2]}|${context[context.length - 1]}`;
      transitions = ngramTransitionTable.get(stateKey);
    }

    // 如果 N-gram 没有找到，回退到一阶转移表
    if (!transitions || transitions.size === 0) {
      transitions = transitionTable.get(currentWord);
    }

    // 如果还是没有，使用高频词（但需要过滤）
    if (!transitions || transitions.size === 0) {
      const highFreqWord = this.getRandomHighFrequencyWord();
      if (highFreqWord && !usedWords.has(highFreqWord)) {
        return highFreqWord;
      }
      return null;
    }

    // 应用重复词过滤
    const filteredTransitions = new Map<string, number>();
    const total = Array.from(transitions.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const vocabSize = Math.max(this.vocabulary.size, 1000);
    const alpha = this.SMOOTHING_ALPHA;

    transitions.forEach((count, word) => {
      // 禁止连续重复
      if (word === currentWord) {
        return;
      }

      // 禁止重复 bigram
      const bigram = `${currentWord}|${word}`;
      if (usedBigrams.has(bigram)) {
        return;
      }

      // 禁止 A-B-A 模式
      if (result.length >= 2 && result[result.length - 2] === word) {
        return;
      }

      // Laplace 平滑
      const smoothedProb = (count + alpha) / (total + alpha * vocabSize);

      // 对已使用词降权 30%
      let adjustedProb = smoothedProb;
      if (usedWords.has(word)) {
        adjustedProb *= 0.7;
      }

      // 偏好关键词权重提升 2 倍
      if (
        preferredKeywords &&
        preferredKeywords.some(kw => word.includes(kw))
      ) {
        adjustedProb *= 2.0;
      }

      // 应用温度参数
      adjustedProb = Math.pow(adjustedProb, 1 / temperature);
      filteredTransitions.set(word, adjustedProb);
    });

    // 如果所有词都被过滤掉了，回退到原始方法（但至少排除连续重复）
    if (filteredTransitions.size === 0) {
      for (const [word, count] of transitions.entries()) {
        if (word !== currentWord) {
          const smoothedProb = (count + alpha) / (total + alpha * vocabSize);
          let adjustedProb = Math.pow(smoothedProb, 1 / temperature);
          // 偏好关键词权重提升
          if (
            preferredKeywords &&
            preferredKeywords.some(kw => word.includes(kw))
          ) {
            adjustedProb *= 2.0;
          }
          filteredTransitions.set(word, adjustedProb);
        }
      }
    }

    if (filteredTransitions.size === 0) {
      return null;
    }

    const totalProbability = Array.from(filteredTransitions.values()).reduce(
      (sum, prob) => sum + prob,
      0
    );

    let random = Math.random() * totalProbability;

    for (const [word, probability] of filteredTransitions.entries()) {
      random -= probability;
      if (random <= 0) {
        return word;
      }
    }

    return Array.from(filteredTransitions.keys())[0];
  }

  /**
   * 根据 N-gram 上下文获取下一个词（带回退机制）
   * @param context 上下文数组（最近的 N-1 个词）
   * @param temperature 温度参数
   * @param transitionTable 一阶转移表（用于回退）
   * @param ngramTransitionTable N-gram 转移表
   * @returns 下一个词
   */
  private getNextWordNGram(
    context: string[],
    temperature: number,
    transitionTable: Map<string, Map<string, number>>,
    ngramTransitionTable: Map<string, Map<string, number>>
  ): string | null {
    // 如果上下文长度足够，尝试使用 N-gram（二阶）
    if (context.length >= 2 && this.config.order >= 2) {
      const stateKey = `${context[context.length - 2]}|${context[context.length - 1]}`;
      const ngramTransitions = ngramTransitionTable.get(stateKey);

      if (ngramTransitions && ngramTransitions.size > 0) {
        return this.selectWordFromTransitions(ngramTransitions, temperature);
      }
    }

    // 回退到一阶转移表
    if (context.length >= 1) {
      const currentWord = context[context.length - 1];
      const transitions = transitionTable.get(currentWord);

      if (transitions && transitions.size > 0) {
        return this.selectWordFromTransitions(transitions, temperature);
      }
    }

    // 最终回退：使用高频词
    return this.getRandomHighFrequencyWord();
  }

  /**
   * 从转移表中根据概率分布选择词
   * @param transitions 转移映射
   * @param temperature 温度参数
   * @returns 选中的词
   */
  private selectWordFromTransitions(
    transitions: Map<string, number>,
    temperature: number
  ): string | null {
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
   * 根据概率分布选择下一个词（带重复词过滤）
   * @param currentWord 当前词
   * @param temperature 温度参数
   * @param transitionTable 状态转移表
   * @param usedWords 已使用的词汇集合
   * @param usedBigrams 已使用的二元组集合
   * @param result 当前生成的结果数组（用于检测 A-B-A 模式）
   * @param preferredKeywords 偏好关键词（可选）
   * @returns 下一个词
   */
  private getNextWordFiltered(
    currentWord: string,
    temperature: number,
    transitionTable: Map<string, Map<string, number>>,
    usedWords: Set<string>,
    usedBigrams: Set<string>,
    result: string[],
    preferredKeywords?: string[]
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

    // 应用 Laplace 平滑、温度参数和重复词过滤
    transitions.forEach((count, word) => {
      // 禁止连续重复
      if (word === currentWord) {
        return;
      }

      // 禁止重复 bigram
      const bigram = `${currentWord}|${word}`;
      if (usedBigrams.has(bigram)) {
        return;
      }

      // 禁止 A-B-A 模式（检查前一个词是否与当前候选词相同）
      if (result.length >= 2 && result[result.length - 2] === word) {
        return;
      }

      // Laplace 平滑: P(w) = (count + alpha) / (total + alpha * V)
      const smoothedProb = (count + alpha) / (total + alpha * vocabSize);

      // 对已使用词降权 30%
      let adjustedProb = smoothedProb;
      if (usedWords.has(word)) {
        adjustedProb *= 0.7;
      }

      // 偏好关键词权重提升 2 倍
      if (
        preferredKeywords &&
        preferredKeywords.some(kw => word.includes(kw))
      ) {
        adjustedProb *= 2.0;
      }

      // 应用温度参数
      adjustedProb = Math.pow(adjustedProb, 1 / temperature);
      normalizedTransitions.set(word, adjustedProb);
    });

    // 如果所有词都被过滤掉了，回退到原始方法（但至少排除连续重复）
    if (normalizedTransitions.size === 0) {
      for (const [word, count] of transitions.entries()) {
        if (word !== currentWord) {
          const smoothedProb = (count + alpha) / (total + alpha * vocabSize);
          let adjustedProb = Math.pow(smoothedProb, 1 / temperature);
          // 偏好关键词权重提升
          if (
            preferredKeywords &&
            preferredKeywords.some(kw => word.includes(kw))
          ) {
            adjustedProb *= 2.0;
          }
          normalizedTransitions.set(word, adjustedProb);
        }
      }
    }

    // 如果仍然没有候选词，返回 null
    if (normalizedTransitions.size === 0) {
      return null;
    }

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

    // 回退：返回第一个候选词
    return Array.from(normalizedTransitions.keys())[0];
  }

  /**
   * 计算年份权重
   * @param topicYear 题目年份
   * @param targetYear 目标年份
   * @param decayFactor 衰减因子，默认 0.85
   * @returns 权重值（0-1）
   */
  private calculateYearWeight(
    topicYear: number | null | undefined,
    targetYear: number | undefined,
    decayFactor: number = 0.85
  ): number {
    if (!targetYear || !topicYear) {
      return 1.0; // 如果没有目标年份或题目年份，返回默认权重
    }

    const yearDiff = Math.abs(topicYear - targetYear);

    // 指定年份权重 1.0，每差一年衰减 15%
    return Math.pow(decayFactor, yearDiff);
  }

  /**
   * 清空模型数据
   */
  clear(): void {
    this.transitionTable.clear();
    this.ngramTransitionTable.clear();
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

      // 1. 加载生成配置
      await this.loadGenerationConfig();

      // 2. 加载专业类别映射
      await this.loadMajorCategories();

      // 3. 加载预计算模型
      await this.loadPrecomputedModels();

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

      // 重建高频词列表（优先使用预计算的全局模型数据）
      if (this.generalModel && this.generalModel.highFreqWords.length > 0) {
        this.highFrequencyWords = this.generalModel.highFreqWords;
      } else {
        this.highFrequencyWords = Array.from(wordFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 100)
          .map(([word]) => word);
      }

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

      // 构建专业特定链（使用预计算数据）
      majorChainMap.forEach((chains, major) => {
        const transitionTable = new Map<string, Map<string, number>>();

        chains.forEach(chain => {
          if (!transitionTable.has(chain.currentWord)) {
            transitionTable.set(chain.currentWord, new Map());
          }

          const nextWordMap = transitionTable.get(chain.currentWord)!;
          nextWordMap.set(chain.nextWord, chain.frequency);
        });

        // 尝试使用预计算的开始/结束词，否则使用默认值
        const precomputedModel = this.precomputedModels.get(`major:${major}`);
        const startTokens = precomputedModel?.startTokens?.length
          ? new Set(precomputedModel.startTokens)
          : new Set(this.defaultStartTokens);
        const endTokens = precomputedModel?.endTokens?.length
          ? new Set(precomputedModel.endTokens)
          : new Set(this.defaultEndTokens);

        this.majorSpecificChains.set(major, {
          transitionTable,
          startTokens,
          endTokens,
        });
      });

      // 构建类别特定链（使用预计算数据）
      for (const [categoryName, categoryModel] of this.categoryModels) {
        if (!this.categoryChains.has(categoryName)) {
          // 类别链的转移表需要从属于该类别的所有专业聚合
          const categoryTransitionTable = new Map<
            string,
            Map<string, number>
          >();

          // 找到所有属于该类别的专业
          for (const [majorName, category] of this.majorCategories) {
            if (category === categoryName) {
              const majorChain = this.majorSpecificChains.get(majorName);
              if (majorChain) {
                // 聚合转移表
                majorChain.transitionTable.forEach((nextWords, currentWord) => {
                  if (!categoryTransitionTable.has(currentWord)) {
                    categoryTransitionTable.set(currentWord, new Map());
                  }
                  const categoryNextWords =
                    categoryTransitionTable.get(currentWord)!;
                  nextWords.forEach((freq, nextWord) => {
                    categoryNextWords.set(
                      nextWord,
                      (categoryNextWords.get(nextWord) || 0) + freq
                    );
                  });
                });
              }
            }
          }

          this.categoryChains.set(categoryName, {
            transitionTable: categoryTransitionTable,
            startTokens: new Set(
              categoryModel.startTokens || this.defaultStartTokens
            ),
            endTokens: new Set(
              categoryModel.endTokens || this.defaultEndTokens
            ),
          });
        }
      }

      console.log(
        `✅ 模型加载成功: 通用状态${this.transitionTable.size}个, 专业模型${this.majorSpecificChains.size}个, 类别模型${this.categoryChains.size}个, 词汇表${this.vocabulary.size}个`
      );
      console.log(
        `   预计算模型: ${this.precomputedModels.size}个, 专业类别映射: ${this.majorCategories.size}个`
      );
    } catch (error) {
      console.error('从数据库加载模型失败:', error);
      throw error;
    }
  }

  /**
   * 加载生成配置
   */
  private async loadGenerationConfig(): Promise<void> {
    try {
      const configs = await prisma.generationConfig.findMany();

      for (const config of configs) {
        const value = config.value as number;
        switch (config.key) {
          case 'majorMinSamples':
            this.generationConfig.majorMinSamples = value;
            break;
          case 'categoryMinSamples':
            this.generationConfig.categoryMinSamples = value;
            break;
          case 'qualityThreshold':
            this.generationConfig.qualityThreshold = value;
            break;
          case 'lowSampleQualityPenalty':
            this.generationConfig.lowSampleQualityPenalty = value;
            break;
        }
      }

      console.log(
        `   配置加载: majorMinSamples=${this.generationConfig.majorMinSamples}, qualityPenalty=${this.generationConfig.lowSampleQualityPenalty}`
      );
    } catch (error) {
      console.warn('加载生成配置失败，使用默认值:', error);
    }
  }

  /**
   * 加载专业类别映射
   */
  private async loadMajorCategories(): Promise<void> {
    try {
      const categories = await prisma.majorCategory.findMany();

      this.majorCategories.clear();
      for (const cat of categories) {
        this.majorCategories.set(cat.major, cat.category);
      }

      console.log(`   专业类别映射加载: ${this.majorCategories.size}个`);
    } catch (error) {
      console.warn('加载专业类别映射失败:', error);
    }
  }

  /**
   * 加载预计算模型
   */
  private async loadPrecomputedModels(): Promise<void> {
    try {
      const models = await prisma.precomputedModel.findMany();

      this.precomputedModels.clear();
      this.categoryModels.clear();
      this.generalModel = null;

      for (const model of models) {
        const modelInfo: PrecomputedModelInfo = {
          scope: model.scope,
          name: model.name,
          startTokens: model.startTokens as string[],
          endTokens: model.endTokens as string[],
          highFreqWords: model.highFreqWords as string[],
          sampleCount: model.sampleCount,
          stateCount: model.stateCount,
          fallbackTo: model.fallbackTo,
          isReady: model.isReady,
        };

        const key = `${model.scope}:${model.name}`;
        this.precomputedModels.set(key, modelInfo);

        if (model.scope === 'general') {
          this.generalModel = modelInfo;
        } else if (model.scope === 'category') {
          this.categoryModels.set(model.name, modelInfo);
        }
      }

      const readyMajors = Array.from(this.precomputedModels.values()).filter(
        m => m.scope === 'major' && m.isReady
      ).length;
      const totalMajors = Array.from(this.precomputedModels.values()).filter(
        m => m.scope === 'major'
      ).length;

      console.log(
        `   预计算模型加载: ${this.precomputedModels.size}个 (可用专业: ${readyMajors}/${totalMajors}, 类别: ${this.categoryModels.size}个)`
      );
    } catch (error) {
      console.warn('加载预计算模型失败:', error);
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
    const {
      count = 5,
      major,
      qualityThreshold = 0.15,
      preferredKeywords,
    } = options;
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
          preferredKeywords,
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

      // 批量语义验证
      const semanticResults =
        await semanticValidator.validateTopics(candidates);

      for (
        let i = 0;
        i < processedTopics.length && results.length < count;
        i++
      ) {
        const processed = processedTopics[i];
        const semantic = semanticResults[i];

        // 综合质量分数和语义验证分数
        const combinedQuality = processed.quality * 0.7 + semantic.score * 0.3;

        if (processed.quality >= qualityThreshold && semantic.isValid) {
          results.push(candidates[i]);
          console.log(
            `✓ 马尔科夫生成题目 ${results.length}: ${candidates[i]} (质量: ${processed.quality.toFixed(2)}, 语义: ${semantic.score.toFixed(2)}, 综合: ${combinedQuality.toFixed(2)})`
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
            preferredKeywords,
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
      preferredKeywords?: string[];
    } = {}
  ): string {
    const {
      startWord,
      temperature = 1.0,
      majorId,
      preferredKeywords,
    } = options;

    // 使用分层回退机制获取合适的模型
    const { transitionTable, modelType, qualityFactor } =
      this.getModelForMajor(majorId);

    // 记录模型信息
    let modelName = '_global';
    if (modelType === 'major' && majorId) {
      modelName = majorId;
    } else if (modelType === 'category' && majorId) {
      const precomputed = this.precomputedModels.get(`major:${majorId}`);
      modelName =
        precomputed?.fallbackTo ||
        this.getCategoryForMajor(majorId) ||
        '_global';
    }

    this.lastUsedModelInfo = {
      modelType,
      modelName,
      qualityFactor,
      originalMajor: majorId,
    };

    if (modelType !== 'general') {
      console.log(
        `使用${modelType === 'major' ? '专业特定' : '类别'}模型生成 (${modelName}, 质量因子: ${qualityFactor})`
      );
    }

    if (transitionTable.size === 0) {
      throw new Error('模型未经过训练');
    }

    let currentWord =
      startWord || this.getRandomStartWord(majorId, preferredKeywords);
    const result: string[] = [currentWord];

    // 跟踪已使用的词汇和二元组，防止重复
    const usedWords = new Set<string>([currentWord]);
    const usedBigrams = new Set<string>();

    // 获取 N-gram 转移表（如果有）
    const ngramTable =
      this.ngramTransitionTable.size > 0 ? this.ngramTransitionTable : null;

    while (result.length < this.config.maxLength) {
      // 构建上下文（用于 N-gram）
      const context = result.slice(-Math.min(this.config.order, result.length));

      // 使用 N-gram 方法获取候选词
      let nextWord: string | null = null;

      if (ngramTable && context.length >= 2) {
        // 尝试使用 N-gram
        const candidates = this.getNextWordNGramFiltered(
          context,
          temperature,
          transitionTable,
          ngramTable,
          usedWords,
          usedBigrams,
          result,
          preferredKeywords
        );
        nextWord = candidates;
      } else {
        // 回退到过滤的一阶方法
        nextWord = this.getNextWordFiltered(
          currentWord,
          temperature,
          transitionTable,
          usedWords,
          usedBigrams,
          result,
          preferredKeywords
        );
      }

      if (!nextWord || this.isEndWord(nextWord, majorId)) {
        break;
      }

      // 记录新的二元组
      const bigram = `${currentWord}|${nextWord}`;
      usedBigrams.add(bigram);

      result.push(nextWord);
      usedWords.add(nextWord);
      currentWord = nextWord;

      if (result.length >= this.config.minLength && Math.random() < 0.2) {
        break;
      }
    }

    // 使用智能拼接
    return this.smartJoin(result);
  }

  /**
   * 获取最后一次生成使用的模型信息
   * @returns 模型信息，包括模型类型、名称、质量因子
   */
  getLastUsedModelInfo(): {
    modelType: 'major' | 'category' | 'general';
    modelName: string;
    qualityFactor: number;
    originalMajor?: string;
  } | null {
    return this.lastUsedModelInfo;
  }

  /**
   * 获取专业的模型可用性信息
   * @param major 专业名称
   * @returns 模型信息
   */
  getMajorModelInfo(major: string): {
    isReady: boolean;
    fallbackTo: string | null;
    sampleCount: number;
    category: string | null;
  } {
    const precomputed = this.precomputedModels.get(`major:${major}`);
    const category = this.getCategoryForMajor(major);

    if (precomputed) {
      return {
        isReady: precomputed.isReady,
        fallbackTo: precomputed.fallbackTo,
        sampleCount: precomputed.sampleCount,
        category,
      };
    }

    // 如果没有预计算数据，尝试从专业链获取
    const majorChain = this.majorSpecificChains.get(major);
    const hasModel = majorChain && majorChain.transitionTable.size > 0;

    return {
      isReady: hasModel || false,
      fallbackTo: hasModel ? null : category || '_global',
      sampleCount: majorChain?.transitionTable.size || 0,
      category,
    };
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
