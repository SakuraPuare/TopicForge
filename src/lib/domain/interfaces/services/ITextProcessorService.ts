/**
 * Text Processor Service Interface
 * 文本处理服务接口
 */

import type {
  ProcessedTopic,
  QualityAssessment,
  KeywordExtractionConfig,
} from '../../../interfaces/text-processing';

export interface ITextProcessorService {
  /**
   * 处理单个文本
   */
  process(text: string, major?: string): ProcessedTopic;

  /**
   * 批量处理文本
   */
  batchProcess(
    texts: string[],
    majors?: (string | undefined)[]
  ): ProcessedTopic[];

  /**
   * 高性能批量处理（用于训练）
   */
  batchProcessForTraining(
    titles: string[],
    majors?: (string | undefined)[]
  ): (ProcessedTopic & { major?: string })[];

  /**
   * 分词
   */
  tokenize(text: string): string[];

  /**
   * 提取关键词
   */
  extractKeywords(text: string, config?: KeywordExtractionConfig): string[];

  /**
   * 评估质量
   */
  assessQuality(tokens: string[], keywords: string[]): QualityAssessment;
}
