/**
 * Data Service
 * 数据获取服务 - 使用新的 Repository 层
 */

import {
  getGraduationTopicRepository,
  getGenerationSessionRepository,
} from '../db';
import type {
  IDataService,
  MajorYearData,
  GenerationSessionInfo,
} from '../domain/interfaces/services/IDataService';
import type {
  GenerationResult,
  GenerationParams,
} from '../interfaces/generation';

// Re-export for backward compatibility
export type { MajorYearData };

/**
 * 数据获取服务类
 * 负责从数据库获取基础数据
 *
 * 注意：此服务已迁移到使用新的 Repository 层
 * 当前使用单例模式，后续可迁移到 DI 容器
 */
export class DataService implements IDataService {
  /**
   * 获取所有专业和年份信息
   */
  async getMajorsAndYears(): Promise<MajorYearData> {
    try {
      const repo = getGraduationTopicRepository();
      const [majorsResult, yearsResult] = await Promise.all([
        repo.getDistinctMajors(),
        repo.getDistinctYears(),
      ]);

      return {
        majors: majorsResult.success ? majorsResult.data : [],
        years: yearsResult.success ? yearsResult.data : [],
      };
    } catch (error) {
      console.error('获取专业和年份数据失败:', error);
      return { majors: [], years: [] };
    }
  }

  /**
   * 获取所有专业列表
   */
  async getMajors(): Promise<string[]> {
    const repo = getGraduationTopicRepository();
    const result = await repo.getDistinctMajors();
    return result.success ? result.data : [];
  }

  /**
   * 获取所有年份列表
   */
  async getYears(): Promise<number[]> {
    const repo = getGraduationTopicRepository();
    const result = await repo.getDistinctYears();
    return result.success ? result.data : [];
  }

  /**
   * 根据专业获取相关年份
   */
  async getYearsByMajor(major: string): Promise<number[]> {
    const repo = getGraduationTopicRepository();
    const result = await repo.getYearsByMajor(major);
    return result.success ? result.data : [];
  }

  /**
   * 统计专业下的题目数量
   */
  async getTopicCountByMajor(major: string): Promise<number> {
    const repo = getGraduationTopicRepository();
    const result = await repo.count({ major });
    return result.success ? result.data : 0;
  }

  /**
   * 统计年份下的题目数量
   */
  async getTopicCountByYear(year: number): Promise<number> {
    const repo = getGraduationTopicRepository();
    const result = await repo.count({ year });
    return result.success ? result.data : 0;
  }

  /**
   * 保存生成会话
   */
  async saveGenerationSession(result: GenerationResult): Promise<string> {
    try {
      const repo = getGenerationSessionRepository();
      const saveResult = await repo.save({
        topics: result.topics,
        algorithm: result.algorithm,
        params: (result.params || {}) as Record<string, unknown>,
        stats: result.stats as Record<string, unknown>,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error.message);
      }

      return saveResult.data.id;
    } catch (error) {
      console.error('保存生成会话失败:', error);
      throw new Error('保存生成结果失败');
    }
  }

  /**
   * 获取生成会话
   */
  async getGenerationSession(
    sessionId: string
  ): Promise<GenerationResult | null> {
    try {
      const repo = getGenerationSessionRepository();
      const result = await repo.findById(sessionId);

      if (!result.success || !result.data) {
        return null;
      }

      const session = result.data;

      // 检查是否过期
      if (session.expiresAt < new Date()) {
        // 删除过期的会话
        await repo.delete(sessionId);
        return null;
      }

      return {
        topics: session.topics,
        algorithm: session.algorithm,
        params: session.params as GenerationParams,
        stats: session.stats as GenerationResult['stats'],
      };
    } catch (error) {
      console.error('获取生成会话失败:', error);
      return null;
    }
  }

  /**
   * 获取最近的生成历史记录
   */
  async getRecentGenerationSessions(
    limit: number = 10
  ): Promise<GenerationSessionInfo[]> {
    try {
      const repo = getGenerationSessionRepository();
      const result = await repo.findRecent(limit);

      if (!result.success) {
        return [];
      }

      return result.data.map(session => ({
        id: session.id,
        algorithm: session.algorithm,
        params: session.params as GenerationParams,
        stats: session.stats as GenerationResult['stats'],
        createdAt: session.createdAt,
        topicCount: session.topics.length,
      }));
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 清理过期的生成会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const repo = getGenerationSessionRepository();
      const result = await repo.deleteExpired();
      return result.success ? result.data : 0;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      return 0;
    }
  }
}

// 导出单例实例（向后兼容）
export const dataService = new DataService();
