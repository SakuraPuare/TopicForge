/**
 * Markov Chain Service Interface
 * 马尔科夫链服务接口
 */

import type { ProcessedTopic } from '../../../interfaces/text-processing';
import type {
  MarkovStats,
  GenerationOptions,
} from '../../../interfaces/markov';

export interface IMarkovChainService {
  /**
   * 训练马尔科夫链模型
   */
  train(topics: (ProcessedTopic & { major?: string })[]): Promise<void>;

  /**
   * 从数据库加载已训练的模型
   */
  loadFromDatabase(): Promise<void>;

  /**
   * 保存模型到数据库
   */
  saveToDatabase(): Promise<void>;

  /**
   * 生成多个主题
   */
  generate(options?: Partial<GenerationOptions>): Promise<string[]>;

  /**
   * 清空模型数据
   */
  clear(): void;

  /**
   * 获取统计信息
   */
  getStats(): MarkovStats;
}
