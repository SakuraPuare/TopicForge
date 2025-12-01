/**
 * Template Generator Service Interface
 * 模板生成器服务接口
 */

import type { GenerationOptions } from '../../../interfaces/markov';

export interface TemplateStats {
  totalTemplates: number;
  generalTemplates: number;
  majorSpecificTemplates: Record<string, number>;
  vocabularySize: number;
}

export interface ITemplateGeneratorService {
  /**
   * 生成主题
   */
  generate(options?: Partial<GenerationOptions>): Promise<string[]>;

  /**
   * 获取统计信息
   */
  getStats(): TemplateStats;
}
