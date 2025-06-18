import { PrismaClient } from '@prisma/client';
import { textProcessor } from './text-processor.service';
import { markovChainService } from './markov-chain.service';
import { templateGenerator } from './template-generator.service';
import { majorService } from './major.service';
import { ProcessedTopic } from '../interfaces/text-processing';
import {
  GenerationParams,
  GenerationResult,
  MajorInfo,
  TrainingConfig,
} from '../interfaces/generation';
import { MarkovStats } from '../interfaces/markov';

const prisma = new PrismaClient();

/**
 * 主题生成器主服务类
 */
export class TopicGeneratorService {
  private isModelTrained = false;
  private lastTrainingTime: Date | null = null;

  constructor() {
    // 尝试加载已训练的模型
    this.loadTrainedModel().catch(() => {
      console.log('启动时未能加载训练模型，将在首次生成时重新训练');
    });
  }

  /**
   * 训练模型（支持特定专业训练）
   * @param major 专业名称，如果提供则只训练该专业
   * @param config 训练配置
   */
  async trainModel(major?: string, config: TrainingConfig = {}): Promise<void> {
    console.log('开始训练主题生成模型...');

    try {
      // 检查是否需要重新训练
      if (!config.forceRetrain && this.shouldSkipTraining()) {
        console.log('模型已在24小时内训练过，跳过重新训练');
        return;
      }

      // 同步专业信息
      await majorService.syncMajorInfoFromTopics();

      // 获取训练数据
      const topics = await this.getTrainingData(major);
      if (topics.length === 0) {
        const errorMessage = major
          ? `专业 "${major}" 没有可用的训练数据`
          : '没有可用的训练数据，请先运行爬虫程序';
        throw new Error(errorMessage);
      }

      // 如果指定了专业，额外检查该专业是否存在有效数据
      if (major) {
        const majorTopics = topics.filter(t => t.major === major);
        if (majorTopics.length === 0) {
          throw new Error(`专业 "${major}" 没有匹配的训练数据`);
        }
      }

      // 处理文本数据
      const processedTopics = await this.processTrainingData(topics, config);
      if (processedTopics.length === 0) {
        const errorMessage = major
          ? `专业 "${major}" 没有满足质量要求的训练数据`
          : '没有满足质量要求的训练数据';
        throw new Error(errorMessage);
      }

      // 训练马尔科夫链
      await markovChainService.train(processedTopics);

      // 保存到数据库
      await markovChainService.saveToDatabase();

      // 保存训练结果
      await this.saveTrainingResults(topics, processedTopics);

      this.isModelTrained = true;
      this.lastTrainingTime = new Date();

      console.log('✅ 模型训练完成！');
    } catch (error) {
      console.error('训练模型时出错:', error);
      throw error;
    }
  }

  /**
   * 检查是否应该跳过训练
   * @returns 是否跳过
   */
  private shouldSkipTraining(): boolean {
    if (!this.isModelTrained || !this.lastTrainingTime) {
      return false;
    }

    const hoursSinceTraining =
      (Date.now() - this.lastTrainingTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceTraining < 24;
  }

  /**
   * 获取训练数据
   * @param major 可选的专业过滤器
   * @returns 原始题目数据
   */
  private async getTrainingData(major?: string): Promise<
    Array<{
      id: string;
      title: string;
      major?: string | null;
      school?: string | null;
      year?: number | null;
    }>
  > {
    const whereClause: { major?: string; processed?: boolean } = {};

    // 如果指定了专业，添加过滤条件
    if (major) {
      whereClause.major = major;
    }

    // 优先获取未处理的题目
    let topics = await prisma.graduationTopic.findMany({
      where: { ...whereClause, processed: false },
      select: {
        id: true,
        title: true,
        major: true,
        school: true,
        year: true,
      },
    });

    console.log(
      `获取到 ${topics.length} 个未处理的题目${major ? `（专业：${major}）` : ''}`
    );

    // 如果没有未处理的题目，使用所有题目
    if (topics.length === 0) {
      console.log('没有未处理的题目，使用所有题目进行训练');
      topics = await prisma.graduationTopic.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          major: true,
          school: true,
          year: true,
        },
      });
    }

    return topics;
  }

  /**
   * 处理训练数据 - 高性能版本
   * @param topics 原始题目
   * @param config 训练配置
   * @returns 处理后的题目
   */
  private async processTrainingData(
    topics: Array<{
      id: string;
      title: string;
      major?: string | null;
    }>,
    config: TrainingConfig
  ): Promise<(ProcessedTopic & { major?: string })[]> {
    console.log('🚀 开始高性能处理训练数据...');

    const titles = topics.map(t => t.title);
    const majors = topics.map(t => t.major || undefined);

    // 使用高性能批量处理
    const processedTopics = textProcessor.batchProcessForTraining(
      titles,
      majors
    );

    // 过滤低质量题目
    const qualityThreshold = config.qualityThreshold || 0.3;
    const validTopics = processedTopics.filter(
      topic => topic.quality >= qualityThreshold
    );

    console.log(
      `✅ 文本处理完成！有效题目: ${validTopics.length.toLocaleString()}/${processedTopics.length.toLocaleString()}，` +
        `平均质量分数: ${(validTopics.reduce((sum, t) => sum + t.quality, 0) / validTopics.length).toFixed(2)}`
    );

    // 保存处理结果
    await this.saveProcessedData(topics, processedTopics, config);

    return validTopics;
  }

  /**
   * 保存处理后的数据
   * @param originalTopics 原始题目
   * @param processedTopics 处理后的题目
   * @param config 配置
   */
  private async saveProcessedData(
    originalTopics: Array<{ id: string; title: string }>,
    processedTopics: ProcessedTopic[],
    config: TrainingConfig
  ): Promise<void> {
    console.log('保存处理后的数据...');

    const batchSize = config.batchSize || 1000;

    // 删除旧的分词结果
    const topicIds = originalTopics.map(t => t.id);
    await prisma.tokenizedWord.deleteMany({
      where: { topicId: { in: topicIds } },
    });

    // 准备分词数据
    const allTokenizedWords: Array<{
      topicId: string;
      word: string;
      position: number;
      frequency: number;
    }> = [];

    for (let i = 0; i < originalTopics.length; i++) {
      const original = originalTopics[i];
      const processed = processedTopics[i];

      processed.tokens.forEach((word, position) => {
        allTokenizedWords.push({
          topicId: original.id,
          word,
          position,
          frequency: 1,
        });
      });
    }

    // 批量插入分词结果
    console.log(`批量插入 ${allTokenizedWords.length} 个分词结果...`);
    for (let i = 0; i < allTokenizedWords.length; i += batchSize) {
      const batch = allTokenizedWords.slice(i, i + batchSize);
      await prisma.tokenizedWord.createMany({
        data: batch,
      });

      const progress = Math.min(i + batchSize, allTokenizedWords.length);
      console.log(
        `分词进度: ${progress}/${allTokenizedWords.length} (${((progress / allTokenizedWords.length) * 100).toFixed(1)}%)`
      );
    }

    // 更新题目关键词
    const updateBatchSize = 500;
    for (let i = 0; i < originalTopics.length; i += updateBatchSize) {
      const batch = originalTopics.slice(i, i + updateBatchSize);

      await prisma.$transaction(
        batch.map((original, idx) =>
          prisma.graduationTopic.update({
            where: { id: original.id },
            data: {
              keywords: JSON.stringify(processedTopics[i + idx].keywords),
              processed: true,
            },
          })
        )
      );

      const progress = Math.min(i + updateBatchSize, originalTopics.length);
      console.log(
        `关键词更新进度: ${progress}/${originalTopics.length} (${((progress / originalTopics.length) * 100).toFixed(1)}%)`
      );
    }

    console.log('✅ 处理后的数据保存完成');
  }

  /**
   * 保存训练结果
   * @param originalTopics 原始题目
   * @param processedTopics 处理后的题目
   */
  private async saveTrainingResults(
    originalTopics: Array<{ id: string; title: string; major?: string | null }>,
    processedTopics: (ProcessedTopic & { major?: string })[]
  ): Promise<void> {
    console.log('保存训练结果...');

    // 更新关键词统计
    await this.updateKeywordStats(processedTopics);

    // 更新专业训练状态
    const majorStats = this.calculateMajorStats(processedTopics);
    for (const [major, stats] of majorStats.entries()) {
      await majorService.updateMajorInfo(major, {
        sampleCount: stats.sampleCount,
        hasModel: stats.sampleCount >= 10,
        lastTrainingAt: new Date(),
        qualityStats: stats.qualityStats,
      });
    }

    console.log('✅ 训练结果保存完成');
  }

  /**
   * 计算专业统计信息
   * @param topics 处理后的题目
   * @returns 专业统计映射
   */
  private calculateMajorStats(
    topics: (ProcessedTopic & { major?: string })[]
  ): Map<
    string,
    {
      sampleCount: number;
      qualityStats: { high: number; medium: number; low: number };
    }
  > {
    const stats = new Map<
      string,
      {
        sampleCount: number;
        qualityStats: { high: number; medium: number; low: number };
      }
    >();

    for (const topic of topics) {
      const major = topic.major || '未分类';

      if (!stats.has(major)) {
        stats.set(major, {
          sampleCount: 0,
          qualityStats: { high: 0, medium: 0, low: 0 },
        });
      }

      const majorStats = stats.get(major)!;
      majorStats.sampleCount++;

      if (topic.quality >= 0.6) {
        majorStats.qualityStats.high++;
      } else if (topic.quality >= 0.3) {
        majorStats.qualityStats.medium++;
      } else {
        majorStats.qualityStats.low++;
      }
    }

    return stats;
  }

  /**
   * 更新关键词统计
   * @param processedTopics 处理后的题目
   */
  private async updateKeywordStats(
    processedTopics: (ProcessedTopic & { major?: string })[]
  ): Promise<void> {
    console.log('更新关键词统计...');

    const keywordCounts = new Map<string, number>();

    processedTopics.forEach(topic => {
      topic.keywords.forEach(keyword => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });
    });

    console.log(`准备更新 ${keywordCounts.size} 个关键词的统计信息...`);

    const updates = Array.from(keywordCounts.entries());
    const batchSize = 500;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map(([keyword, frequency]) =>
          prisma.keywordStats.upsert({
            where: { keyword },
            update: { frequency, updatedAt: new Date() },
            create: { keyword, frequency },
          })
        )
      );

      const progress = Math.min(i + batchSize, updates.length);
      console.log(
        `关键词统计进度: ${progress}/${updates.length} (${((progress / updates.length) * 100).toFixed(1)}%)`
      );
    }

    console.log('✅ 关键词统计更新完成');
  }

  /**
   * 生成主题
   * @param params 生成参数
   * @returns 生成结果
   */
  async generateTopics(
    params: GenerationParams = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    // 确保模型已训练
    if (!this.isModelTrained) {
      await this.loadTrainedModel();
      if (!this.isModelTrained) {
        await this.trainModel(params.major);
      }
    }

    const config = {
      count: 5,
      algorithm: 'markov' as const,
      qualityThreshold: 0.15,
      saveToHistory: true,
      ...params,
    };

    console.log(`开始生成 ${config.count} 个题目，算法: ${config.algorithm}`);

    let generatedTopics: string[] = [];
    let majorInfo: GenerationResult['majorInfo'];
    let fallbackUsed = false;

    // 并行获取专业信息和生成题目
    const [topics, majorInfoResult] = await Promise.all([
      this.generateTopicsInternal(config),
      config.major
        ? majorService.getMajorInfo(config.major)
        : Promise.resolve(null),
    ]);

    generatedTopics = topics.generatedTopics;
    fallbackUsed = topics.fallbackUsed;

    if (majorInfoResult) {
      majorInfo = {
        major: config.major!,
        sampleCount: majorInfoResult.sampleCount,
        hasSpecificModel: majorInfoResult.hasModel,
      };
    }

    // 异步保存生成历史，不阻塞响应
    if (config.saveToHistory && generatedTopics.length > 0) {
      this.saveGenerationHistory(generatedTopics, config).catch(error =>
        console.warn('保存生成历史失败:', error)
      );
    }

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // 计算真实的平均质量
    let avgQuality = 0;
    if (generatedTopics.length > 0) {
      // 对生成的题目进行质量评估
      const processedTopics = generatedTopics.map(
        topic => textProcessor.batchProcess([topic])[0]
      );
      avgQuality =
        processedTopics.reduce((sum, topic) => sum + topic.quality, 0) /
        processedTopics.length;
    }

    const result: GenerationResult = {
      topics: generatedTopics,
      stats: {
        totalGenerated: generatedTopics.length,
        validTopics: generatedTopics.length,
        averageQuality: avgQuality,
        generationTime,
        algorithm: config.algorithm,
        major: config.major,
        fallbackUsed,
      },
      algorithm: config.algorithm,
      params: config,
      majorInfo,
    };

    console.log(
      `生成完成! 耗时: ${generationTime}ms, 题目数: ${generatedTopics.length}, 平均质量: ${avgQuality.toFixed(2)}/5.0`
    );

    return result;
  }

  /**
   * 内部生成方法，处理fallback逻辑
   */
  private async generateTopicsInternal(
    config: GenerationParams
  ): Promise<{ generatedTopics: string[]; fallbackUsed: boolean }> {
    let generatedTopics: string[] = [];
    let fallbackUsed = false;

    try {
      // 根据算法生成题目
      switch (config.algorithm) {
        case 'markov':
          generatedTopics = await this.generateWithMarkov(config);
          break;
        case 'template':
          generatedTopics = await this.generateWithTemplate(config);
          break;
        case 'hybrid':
          generatedTopics = await this.generateWithHybrid(config);
          break;
      }

      // 如果马尔科夫生成失败或数量不足，启用fallback
      if (
        config.algorithm === 'markov' &&
        generatedTopics.length < (config.count || 5)
      ) {
        console.log('马尔科夫生成失败或数量不足，fallback到模板生成');
        const fallbackTopics = await this.generateWithTemplate(config);
        // 合并结果，确保总数不超过要求
        const combined = [...generatedTopics, ...fallbackTopics];
        generatedTopics = combined.slice(0, config.count || 5);
        fallbackUsed = true;
      }
    } catch (error) {
      console.warn('生成失败，使用fallback策略:', error);
      generatedTopics = await this.generateWithTemplate(config);
      fallbackUsed = true;
    }

    return { generatedTopics, fallbackUsed };
  }

  /**
   * 使用马尔科夫链生成
   * @param params 生成参数
   * @returns 生成的题目
   */
  private async generateWithMarkov(
    params: GenerationParams
  ): Promise<string[]> {
    return markovChainService.generate({
      count: params.count || 5,
      major: params.major,
      qualityThreshold: params.qualityThreshold,
    });
  }

  /**
   * 使用模板生成
   * @param params 生成参数
   * @returns 生成的题目
   */
  private async generateWithTemplate(
    params: GenerationParams
  ): Promise<string[]> {
    return templateGenerator.generate({
      count: params.count || 5,
      major: params.major,
      qualityThreshold: params.qualityThreshold,
    });
  }

  /**
   * 使用混合算法生成
   * @param params 生成参数
   * @returns 生成的题目
   */
  private async generateWithHybrid(
    params: GenerationParams
  ): Promise<string[]> {
    const count = params.count || 5;
    const markovCount = Math.ceil(count / 2);
    const templateCount = count - markovCount;

    const [markovTopics, templateTopics] = await Promise.all([
      this.generateWithMarkov({ ...params, count: markovCount }),
      this.generateWithTemplate({ ...params, count: templateCount }),
    ]);

    // 如果马尔科夫生成失败，用模板生成补充
    const allTopics = [...markovTopics, ...templateTopics];
    if (allTopics.length < count) {
      const needMore = count - allTopics.length;
      const moreTopics = await this.generateWithTemplate({
        ...params,
        count: needMore,
      });
      allTopics.push(...moreTopics);
    }

    return allTopics.slice(0, count);
  }

  /**
   * 保存生成历史
   * @param topics 生成的题目
   * @param params 生成参数
   */
  private async saveGenerationHistory(
    topics: string[],
    params: GenerationParams
  ): Promise<void> {
    if (!topics || topics.length === 0) {
      console.warn('没有题目需要保存到历史记录');
      return;
    }

    try {
      const data = topics.map(topic => ({
        content: topic,
        algorithm: params.algorithm || 'markov',
        params: JSON.parse(JSON.stringify(params)),
        createdAt: new Date(),
      }));

      console.log(`准备保存 ${data.length} 条生成历史记录`);

      // 使用事务确保数据一致性
      await prisma.$transaction(async tx => {
        await tx.generatedTopic.createMany({ data });
      });

      console.log(`✅ 成功保存 ${data.length} 条生成历史记录`);
    } catch (error) {
      console.error('保存生成历史失败:', error);
      throw error;
    }
  }

  /**
   * 加载已训练的模型
   */
  private async loadTrainedModel(): Promise<void> {
    try {
      await markovChainService.loadFromDatabase();
      this.isModelTrained = true;
      this.lastTrainingTime = new Date();
    } catch (error) {
      console.log('加载模型失败，需要重新训练:', error);
    }
  }

  /**
   * 获取可用专业列表
   * @returns 专业信息数组
   */
  async getAvailableMajors(): Promise<MajorInfo[]> {
    return majorService.getAvailableMajors();
  }

  /**
   * 获取指定专业的样本数量
   * @param major 专业名称
   * @returns 样本数量
   */
  async getMajorSampleCount(major: string): Promise<number> {
    const info = await majorService.getMajorInfo(major);
    return info?.sampleCount || 0;
  }

  /**
   * 检查专业是否有足够的样本
   * @param major 专业名称
   * @param minSamples 最小样本数
   * @returns 是否有足够样本
   */
  async hasSufficientSamples(
    major: string,
    minSamples: number = 10
  ): Promise<boolean> {
    return majorService.hasSufficientSamples(major, minSamples);
  }

  /**
   * 获取系统统计信息
   * @returns 统计信息
   */
  async getSystemStats(): Promise<{
    topicStats: {
      total: number;
      processed: number;
      unprocessed: number;
    };
    markovStats: MarkovStats;
    templateStats: {
      totalTemplates: number;
      generalTemplates: number;
      majorSpecificTemplates: Record<string, number>;
      vocabularySize: number;
    };
    keywordStats: {
      topKeywords: Array<{ keyword: string; frequency: number }>;
    };
    generationStats: {
      totalGenerated: number;
    };
    majorStats: MajorInfo[];
  }> {
    const [topicCount, processedCount, generatedCount, topKeywords, majors] =
      await Promise.all([
        prisma.graduationTopic.count(),
        prisma.graduationTopic.count({ where: { processed: true } }),
        prisma.generatedTopic.count(),
        prisma.keywordStats.findMany({
          orderBy: { frequency: 'desc' },
          take: 10,
        }),
        majorService.getAvailableMajors(),
      ]);

    return {
      topicStats: {
        total: topicCount,
        processed: processedCount,
        unprocessed: topicCount - processedCount,
      },
      markovStats: markovChainService.getStats(),
      templateStats: templateGenerator.getStats(),
      keywordStats: {
        topKeywords: topKeywords.map(k => ({
          keyword: k.keyword,
          frequency: k.frequency,
        })),
      },
      generationStats: {
        totalGenerated: generatedCount,
      },
      majorStats: majors,
    };
  }
}

// 导出单例实例
export const topicGeneratorService = new TopicGeneratorService();
