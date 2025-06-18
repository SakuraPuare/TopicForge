import { PrismaClient } from '@prisma/client';
import { textProcessor } from './text-processor.service';
import { majorService } from './major.service';
import { ProcessedTopic } from '../interfaces/text-processing';
import {
  MarkovConfig,
  StateTransition,
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
   * 训练马尔科夫链（支持专业分类）
   * @param topics 已处理的题目数据
   */
  async train(topics: (ProcessedTopic & { major?: string })[]): Promise<void> {
    console.log(`开始训练马尔科夫链，共 ${topics.length} 个样本...`);

    this.clearModels();

    // 按专业分组
    const topicsByMajor = this.groupTopicsByMajor(topics);

    // 训练通用模型
    const validTopics = topics.filter(topic => topic.quality >= 0.3);
    this.trainGeneralModel(validTopics);

    // 训练专业特定模型
    await this.trainMajorSpecificModels(topicsByMajor);

    // 保存到数据库
    await this.saveToDatabase();

    this.logTrainingResults(topics);
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
   * @param topics 有效题目
   */
  private trainGeneralModel(topics: ProcessedTopic[]): void {
    topics.forEach(topic => {
      this.trainOnTokens(topic.tokens, this.transitionTable);
    });
  }

  /**
   * 训练专业特定模型
   * @param topicsByMajor 按专业分组的题目
   */
  private async trainMajorSpecificModels(
    topicsByMajor: Map<string, (ProcessedTopic & { major?: string })[]>
  ): Promise<void> {
    for (const [major, topics] of topicsByMajor.entries()) {
      if (major === '未分类') continue;

      const validTopics = topics.filter(topic => topic.quality >= 0.3);

      if (validTopics.length < 5) {
        console.log(
          `专业[${major}]样本太少(${validTopics.length}个)，跳过专业特定训练`
        );
        continue;
      }

      await this.trainMajorSpecificChain(major, validTopics);
    }
  }

  /**
   * 训练专业特定的马尔科夫链
   * @param major 专业名称
   * @param topics 题目数组
   */
  private async trainMajorSpecificChain(
    major: string,
    topics: (ProcessedTopic & { major?: string })[]
  ): Promise<void> {
    const transitionTable = new Map<string, Map<string, number>>();

    topics.forEach(topic => {
      this.trainOnTokens(topic.tokens, transitionTable);
    });

    const qualityStats = this.calculateQualityStats(topics);

    this.majorSpecificChains.set(major, {
      major,
      transitionTable,
      sampleCount: topics.length,
      qualityStats,
    });

    // 更新专业信息
    await majorService.updateMajorInfo(major, {
      sampleCount: topics.length,
      hasModel: true,
      lastTrainingAt: new Date(),
      qualityStats,
    });
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
   * 生成主题
   * @param options 生成选项
   * @returns 生成的主题数组
   */
  async generate(options: GenerationOptions): Promise<string[]> {
    const results: string[] = [];
    let totalAttempts = 0;
    const maxTotalAttempts = options.count * 100;

    console.log(
      `开始生成 ${options.count} 个题目${options.major ? `（专业：${options.major}）` : ''}...`
    );

    // 检查是否使用专业特定模型
    const useMajorSpecific =
      options.major && this.majorSpecificChains.has(options.major);
    if (options.major && !useMajorSpecific) {
      console.log(
        `⚠️ 没有找到专业[${options.major}]的专门训练数据，将使用通用模型`
      );
    }

    for (
      let i = 0;
      i < options.count && totalAttempts < maxTotalAttempts;
      i++
    ) {
      const topic = await this.generateSingleTopic(
        options,
        useMajorSpecific || false
      );

      if (topic && this.isValidTopic(topic, options.qualityThreshold)) {
        results.push(topic);
        console.log(`✓ 生成题目 ${i + 1}: ${topic}`);
      } else {
        i--; // 重试
      }

      totalAttempts++;
    }

    console.log(
      `生成完成: ${results.length}/${options.count} 个题目，总共尝试 ${totalAttempts} 次`
    );
    return results;
  }

  /**
   * 生成单个题目
   * @param options 生成选项
   * @param useMajorSpecific 是否使用专业特定模型
   * @returns 生成的题目
   */
  private async generateSingleTopic(
    options: GenerationOptions,
    useMajorSpecific: boolean
  ): Promise<string | null> {
    if (useMajorSpecific && options.major) {
      return this.generateWithMajorModel(options.major);
    } else {
      return this.generateWithGeneralModel(options);
    }
  }

  /**
   * 使用专业模型生成
   * @param major 专业名称
   * @returns 生成的题目
   */
  private generateWithMajorModel(major: string): string | null {
    const majorChain = this.majorSpecificChains.get(major);
    if (!majorChain) return null;

    return this.generateFromTable(
      majorChain.transitionTable,
      this.getMajorStartTokens(major),
      this.getMajorEndTokens(major)
    );
  }

  /**
   * 使用通用模型生成
   * @param options 生成选项
   * @returns 生成的题目
   */
  private generateWithGeneralModel(options: GenerationOptions): string | null {
    const startTokens = options.preferredStartTokens || this.config.startTokens;
    const endTokens = options.preferredEndTokens || this.config.endTokens;

    return this.generateFromTable(this.transitionTable, startTokens, endTokens);
  }

  /**
   * 从转移表生成文本
   * @param table 转移表
   * @param startTokens 开始词汇
   * @param endTokens 结束词汇
   * @returns 生成的文本
   */
  private generateFromTable(
    table: Map<string, Map<string, number>>,
    startTokens: string[],
    endTokens: string[]
  ): string | null {
    let currentState = this.getInitialState(table, startTokens);
    const generatedTokens: string[] = [];
    let attempts = 0;
    const maxIterations = 50;

    while (
      generatedTokens.length < this.config.maxLength &&
      attempts < maxIterations
    ) {
      attempts++;
      const stateKey = currentState.join('|');
      const nextTokenMap = table.get(stateKey);

      if (!nextTokenMap || nextTokenMap.size === 0) {
        if (currentState.length > 1) {
          currentState = currentState.slice(1);
          continue;
        } else {
          // 使用随机结束词
          const randomEndToken =
            endTokens[Math.floor(Math.random() * endTokens.length)];
          generatedTokens.push(randomEndToken);
          break;
        }
      }

      const nextToken = this.selectNextToken(nextTokenMap);

      if (nextToken === '<END>') {
        break;
      }

      if (nextToken !== '<START>') {
        generatedTokens.push(nextToken);
      }

      currentState = [...currentState.slice(1), nextToken];
    }

    return generatedTokens.length >= this.config.minLength
      ? generatedTokens.join('')
      : null;
  }

  /**
   * 获取初始状态
   * @param table 转移表
   * @param startTokens 开始词汇
   * @returns 初始状态
   */
  private getInitialState(
    table: Map<string, Map<string, number>>,
    startTokens: string[]
  ): string[] {
    // 尝试从 <START> 开始的状态
    const startStates = Array.from(table.keys())
      .filter(key => key.startsWith('<START>'))
      .filter(key => key.split('|').length === this.config.order);

    if (startStates.length > 0) {
      const randomStartState =
        startStates[Math.floor(Math.random() * startStates.length)];
      return randomStartState.split('|');
    }

    // 使用随机开始词汇
    const randomStartToken =
      startTokens[Math.floor(Math.random() * startTokens.length)];
    return ['<START>', randomStartToken];
  }

  /**
   * 基于概率选择下一个token
   * @param tokenMap token频率映射
   * @returns 选中的token
   */
  private selectNextToken(tokenMap: Map<string, number>): string {
    const totalFreq = Array.from(tokenMap.values()).reduce(
      (sum, freq) => sum + freq,
      0
    );
    let randomNum = Math.random() * totalFreq;

    for (const [token, freq] of tokenMap.entries()) {
      randomNum -= freq;
      if (randomNum <= 0) {
        return token;
      }
    }

    // 如果没有选中任何token，返回频率最高的
    const sortedTokens = Array.from(tokenMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedTokens[0][0];
  }

  /**
   * 验证生成的题目是否有效
   * @param topic 题目
   * @param qualityThreshold 质量阈值
   * @returns 是否有效
   */
  private isValidTopic(
    topic: string,
    qualityThreshold: number = 0.15
  ): boolean {
    const processed = textProcessor.batchProcess([topic])[0];
    return processed.quality >= qualityThreshold;
  }

  /**
   * 获取专业特定的开始词汇
   * @param major 专业名称
   * @returns 开始词汇数组
   */
  private getMajorStartTokens(major: string): string[] {
    if (this.majorStartTokensCache.has(major)) {
      return this.majorStartTokensCache.get(major)!;
    }

    let startTokens = [...this.START_TOKENS];
    const majorLower = major.toLowerCase();

    // 根据专业添加特定词汇
    if (majorLower.includes('计算机') || majorLower.includes('软件')) {
      startTokens.push(
        '分布式',
        '微服务',
        '容器化',
        'DevOps',
        '敏捷',
        '可视化'
      );
    }

    if (majorLower.includes('网络') || majorLower.includes('通信')) {
      startTokens.push('无线', '5G', '物联网', '边缘', '软件定义', '网络安全');
    }

    if (majorLower.includes('安全') || majorLower.includes('信息安全')) {
      startTokens.push('网络安全', '信息安全', '加密', '身份认证', '访问控制');
    }

    if (majorLower.includes('数据') || majorLower.includes('大数据')) {
      startTokens.push(
        '大数据',
        '数据挖掘',
        '数据分析',
        '数据可视化',
        '预测',
        '推荐'
      );
    }

    if (
      majorLower.includes('人工智能') ||
      majorLower.includes('AI') ||
      majorLower.includes('机器学习')
    ) {
      startTokens.push(
        '人工智能',
        '机器学习',
        '深度学习',
        '神经网络',
        '自然语言处理'
      );
    }

    startTokens = [...new Set(startTokens)];
    this.majorStartTokensCache.set(major, startTokens);
    return startTokens;
  }

  /**
   * 获取专业特定的结束词汇
   * @param major 专业名称
   * @returns 结束词汇数组
   */
  private getMajorEndTokens(major: string): string[] {
    if (this.majorEndTokensCache.has(major)) {
      return this.majorEndTokensCache.get(major)!;
    }

    let endTokens = [...this.END_TOKENS];
    const majorLower = major.toLowerCase();

    // 根据专业添加特定词汇
    if (majorLower.includes('计算机') || majorLower.includes('软件')) {
      endTokens.push('开发平台', '测试工具', '监控系统', '部署工具', '框架');
    }

    if (majorLower.includes('网络') || majorLower.includes('通信')) {
      endTokens.push(
        '网络',
        '协议',
        '架构',
        '方案',
        '优化',
        '监控',
        '管理',
        '安全'
      );
    }

    if (majorLower.includes('安全') || majorLower.includes('信息安全')) {
      endTokens.push('检测', '防护', '审计', '评估', '检测系统', '防护系统');
    }

    if (majorLower.includes('数据') || majorLower.includes('大数据')) {
      endTokens.push('分析', '挖掘', '预测', '可视化', '分析系统', '挖掘算法');
    }

    if (
      majorLower.includes('人工智能') ||
      majorLower.includes('AI') ||
      majorLower.includes('机器学习')
    ) {
      endTokens.push('算法', '模型', '网络', '识别', '预测', '生成', '优化');
    }

    endTokens = [...new Set(endTokens)];
    this.majorEndTokensCache.set(major, endTokens);
    return endTokens;
  }

  /**
   * 保存到数据库
   */
  private async saveToDatabase(): Promise<void> {
    console.log('保存马尔科夫链数据到数据库...');

    // 保存通用模型
    await this.saveGeneralModel();

    // 保存专业特定模型
    await this.saveMajorSpecificModels();
  }

  /**
   * 保存通用模型
   */
  private async saveGeneralModel(): Promise<void> {
    const transitions = this.exportTrainingData();

    // 清空旧数据
    await prisma.markovChain.deleteMany();

    // 批量插入新数据
    const batchSize = 1000;
    for (let i = 0; i < transitions.length; i += batchSize) {
      const batch = transitions.slice(i, i + batchSize);
      const data = batch.map(t => ({
        currentWord: t.currentState.join('|'),
        nextWord: t.nextToken,
        frequency: t.frequency,
      }));

      await prisma.markovChain.createMany({ data });
    }

    console.log(`保存了 ${transitions.length} 个通用状态转移`);
  }

  /**
   * 保存专业特定模型
   */
  private async saveMajorSpecificModels(): Promise<void> {
    // 清空旧数据
    await prisma.majorMarkovChain.deleteMany();

    for (const [major, chain] of this.majorSpecificChains.entries()) {
      const transitions: Array<{
        major: string;
        currentWord: string;
        nextWord: string;
        frequency: number;
      }> = [];

      for (const [stateKey, tokenMap] of chain.transitionTable.entries()) {
        const currentState = stateKey.split('|');
        for (const [nextToken, frequency] of tokenMap.entries()) {
          transitions.push({
            major,
            currentWord: currentState.join('|'),
            nextWord: nextToken,
            frequency,
          });
        }
      }

      // 批量插入
      const batchSize = 1000;
      for (let i = 0; i < transitions.length; i += batchSize) {
        const batch = transitions.slice(i, i + batchSize);
        await prisma.majorMarkovChain.createMany({ data: batch });
      }

      console.log(`保存了专业[${major}] ${transitions.length} 个状态转移`);
    }
  }

  /**
   * 从数据库加载模型
   */
  async loadFromDatabase(): Promise<void> {
    try {
      console.log('从数据库加载马尔科夫链模型...');

      // 加载通用模型
      await this.loadGeneralModel();

      // 加载专业特定模型
      await this.loadMajorSpecificModels();

      console.log('模型加载完成');
    } catch (error) {
      console.error('加载模型失败:', error);
    }
  }

  /**
   * 加载通用模型
   */
  private async loadGeneralModel(): Promise<void> {
    const markovData = await prisma.markovChain.findMany();

    if (markovData.length > 0) {
      const transitions = markovData.map(item => ({
        currentState: item.currentWord.split('|'),
        nextToken: item.nextWord,
        frequency: item.frequency,
      }));

      this.importTrainingData(transitions);
      console.log(`加载了 ${transitions.length} 个通用状态转移`);
    }
  }

  /**
   * 加载专业特定模型
   */
  private async loadMajorSpecificModels(): Promise<void> {
    const majorData = await prisma.majorMarkovChain.findMany();
    const majorGroups = new Map<string, typeof majorData>();

    // 按专业分组
    majorData.forEach(item => {
      if (!majorGroups.has(item.major)) {
        majorGroups.set(item.major, []);
      }
      majorGroups.get(item.major)!.push(item);
    });

    // 重建专业模型
    for (const [major, data] of majorGroups.entries()) {
      const transitionTable = new Map<string, Map<string, number>>();

      data.forEach(item => {
        const stateKey = item.currentWord;
        if (!transitionTable.has(stateKey)) {
          transitionTable.set(stateKey, new Map());
        }
        transitionTable.get(stateKey)!.set(item.nextWord, item.frequency);
      });

      // 获取质量统计
      const qualityStats = await majorService.getMajorQualityStats(major);

      this.majorSpecificChains.set(major, {
        major,
        transitionTable,
        sampleCount: data.length,
        qualityStats: qualityStats || { high: 0, medium: 0, low: 0 },
      });

      console.log(`加载了专业[${major}] ${data.length} 个状态转移`);
    }
  }

  /**
   * 导出训练数据
   * @returns 状态转移数组
   */
  exportTrainingData(): StateTransition[] {
    const transitions: StateTransition[] = [];

    for (const [stateKey, tokenMap] of this.transitionTable.entries()) {
      const currentState = stateKey.split('|');
      for (const [nextToken, frequency] of tokenMap.entries()) {
        transitions.push({
          currentState,
          nextToken,
          frequency,
        });
      }
    }

    return transitions;
  }

  /**
   * 导入训练数据
   * @param transitions 状态转移数组
   */
  importTrainingData(transitions: StateTransition[]): void {
    this.transitionTable.clear();

    for (const transition of transitions) {
      const stateKey = transition.currentState.join('|');

      if (!this.transitionTable.has(stateKey)) {
        this.transitionTable.set(stateKey, new Map());
      }

      const tokenMap = this.transitionTable.get(stateKey)!;
      tokenMap.set(transition.nextToken, transition.frequency);
    }
  }

  /**
   * 获取统计信息
   * @returns 马尔科夫统计信息
   */
  getStats(): MarkovStats {
    const stateCount = this.transitionTable.size;
    let totalTransitions = 0;
    let maxTransitions = 0;

    for (const transitions of this.transitionTable.values()) {
      const transitionCount = Array.from(transitions.values()).reduce(
        (sum, freq) => sum + freq,
        0
      );
      totalTransitions += transitionCount;
      maxTransitions = Math.max(maxTransitions, transitionCount);
    }

    const majorSpecificStats = new Map<
      string,
      {
        stateCount: number;
        sampleCount: number;
      }
    >();

    for (const [major, chain] of this.majorSpecificChains.entries()) {
      majorSpecificStats.set(major, {
        stateCount: chain.transitionTable.size,
        sampleCount: chain.sampleCount,
      });
    }

    return {
      stateCount,
      totalTransitions,
      averageTransitionsPerState: totalTransitions / stateCount,
      maxTransitionsPerState: maxTransitions,
      config: this.config,
      majorSpecificStats,
    };
  }

  /**
   * 记录训练结果
   * @param topics 训练题目
   */
  private logTrainingResults(topics: ProcessedTopic[]): void {
    console.log(`训练完成，通用模型状态数: ${this.transitionTable.size}`);
    console.log(`专业特定模型数量: ${this.majorSpecificChains.size}`);

    const qualityStats = this.calculateQualityStats(topics);
    console.log(
      `训练样本质量分布: 高质量(>=0.6): ${qualityStats.high}个, ` +
        `中等(0.3-0.6): ${qualityStats.medium}个, 低质量(<0.3): ${qualityStats.low}个`
    );

    for (const [major, chain] of this.majorSpecificChains.entries()) {
      console.log(
        `专业[${major}]: ${chain.sampleCount}个样本, 状态转移数: ${chain.transitionTable.size}`
      );
    }
  }
}

// 导出单例实例
export const markovChainService = new MarkovChainService();
