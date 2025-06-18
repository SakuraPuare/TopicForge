import { MarkovConfig } from './markov';

/**
 * 生成参数接口
 */
export interface GenerationParams {
  count?: number; // 生成数量，默认5
  major?: string; // 专业领域过滤
  keywords?: string[]; // 关键词偏好
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
  topics: string[];
  stats: {
    totalGenerated: number;
    validTopics: number;
    averageQuality: number;
    generationTime: number;
    algorithm?: string;
    major?: string;
    fallbackUsed?: boolean;
  };
  algorithm: string;
  params: GenerationParams;
  majorInfo?: {
    major: string;
    sampleCount: number;
    hasSpecificModel: boolean;
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
}
