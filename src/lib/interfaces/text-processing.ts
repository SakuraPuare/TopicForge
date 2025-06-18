/**
 * 处理后的题目接口
 */
export interface ProcessedTopic {
  originalTitle: string;
  cleanTitle: string;
  tokens: string[];
  keywords: string[];
  tokenCount: number;
  quality: number;
  major?: string; // 添加专业字段
}

/**
 * 文本质量评估结果
 */
export interface QualityAssessment {
  score: number;
  factors: {
    length: number;
    techTerms: number;
    basicTerms: number;
    structure: number;
    uniqueness: number;
  };
}

/**
 * 关键词提取配置
 */
export interface KeywordExtractionConfig {
  topK: number;
  minFrequency?: number;
  includeTechTerms?: boolean;
}
