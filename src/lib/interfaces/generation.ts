import { MarkovConfig } from './markov';

/**
 * 生成参数接口
 */
export interface GenerationParams {
  count?: number; // 生成数量，默认5
  major?: string; // 专业领域过滤
  year?: string; // 参考年份，'all'表示不限年份
  schools?: string[]; // 学校筛选（多选）
  keywords?: string[]; // 关键词偏好
  requiredKeywords?: string[]; // 必须包含的关键词
  excludedKeywords?: string[]; // 必须排除的关键词
  algorithm?: 'markov' | 'template' | 'hybrid'; // 生成算法
  config?: Partial<MarkovConfig>; // 马尔科夫配置
  qualityThreshold?: number; // 质量阈值
  saveToHistory?: boolean; // 是否保存到历史记录
  minQuality?: number; // 最低质量要求
}

/**
 * 生成结果接口
 */
export interface GenerationResult {
  topics: string[]; // 生成的题目数组
  stats: {
    totalGenerated: number; // 总生成数量
    validTopics: number; // 有效题目数量
    averageQuality: number; // 平均质量评分（5分制：0-5分）
    generationTime: number; // 生成耗时（毫秒）
    algorithm: string; // 使用的算法
    major?: string; // 专业领域
    fallbackUsed: boolean; // 是否使用了备用算法
    modelType?: 'major' | 'category' | 'general'; // 实际使用的模型类型
    modelName?: string; // 实际使用的模型名称
    qualityFactor?: number; // 质量因子（低样本专业惩罚系数）
  };
  algorithm: string; // 生成算法
  params?: GenerationParams; // 生成参数
  majorInfo?: {
    major: string;
    sampleCount: number;
    hasSpecificModel: boolean;
    category?: string; // 所属类别
    fallbackTo?: string | null; // 回退目标
  };
}

/**
 * 专业信息接口
 */
export interface MajorInfo {
  major: string;
  count: number;
  sampleCount: number;
  hasModel: boolean;
  lastTrainingTime?: Date;
  qualityStats?: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * 训练配置接口
 */
export interface TrainingConfig {
  forceRetrain?: boolean;
  majorSpecific?: boolean;
  qualityThreshold?: number;
  batchSize?: number;
  targetYear?: number; // 目标年份，用于年份权重训练
  schools?: string[]; // 学校筛选
}
