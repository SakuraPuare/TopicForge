/**
 * Data Service Interface
 * 数据获取服务接口
 */

import type {
  GenerationResult,
  GenerationParams,
} from '../../../interfaces/generation';

export interface MajorYearData {
  majors: string[];
  years: number[];
}

export interface GenerationSessionInfo {
  id: string;
  algorithm: string;
  params: GenerationParams;
  stats: GenerationResult['stats'];
  createdAt: Date;
  topicCount: number;
}

export interface IDataService {
  /**
   * 获取所有专业和年份信息
   */
  getMajorsAndYears(): Promise<MajorYearData>;

  /**
   * 获取所有专业列表
   */
  getMajors(): Promise<string[]>;

  /**
   * 获取所有年份列表
   */
  getYears(): Promise<number[]>;

  /**
   * 根据专业获取相关年份
   */
  getYearsByMajor(major: string): Promise<number[]>;

  /**
   * 统计专业下的题目数量
   */
  getTopicCountByMajor(major: string): Promise<number>;

  /**
   * 统计年份下的题目数量
   */
  getTopicCountByYear(year: number): Promise<number>;

  /**
   * 保存生成会话
   */
  saveGenerationSession(result: GenerationResult): Promise<string>;

  /**
   * 获取生成会话
   */
  getGenerationSession(sessionId: string): Promise<GenerationResult | null>;

  /**
   * 获取最近的生成历史记录
   */
  getRecentGenerationSessions(limit?: number): Promise<GenerationSessionInfo[]>;

  /**
   * 清理过期的生成会话
   */
  cleanupExpiredSessions(): Promise<number>;
}
