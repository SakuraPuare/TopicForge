import { PrismaClient } from '@prisma/client';
import prisma from '../db';
import type {
  GenerationResult,
  GenerationParams,
} from '../interfaces/generation';

export interface MajorYearData {
  majors: string[];
  years: number[];
}

/**
 * 数据获取服务类
 * 负责从数据库获取基础数据
 */
export class DataService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * 获取所有专业和年份信息
   */
  async getMajorsAndYears(): Promise<MajorYearData> {
    try {
      // 获取所有不同的专业和年份
      const majors = await this.db.graduationTopic.findMany({
        distinct: ['major'],
        select: { major: true },
        where: { major: { not: null } },
        orderBy: { major: 'asc' },
      });

      const years = await this.db.graduationTopic.findMany({
        distinct: ['year'],
        select: { year: true },
        where: { year: { not: null } },
        orderBy: { year: 'desc' },
      });

      return {
        majors: majors.map(m => m.major!).filter(Boolean),
        years: years.map(y => y.year!),
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
    const majors = await this.db.graduationTopic.findMany({
      where: {
        AND: [
          {
            major: {
              not: null,
            },
          },
          {
            major: {
              not: '',
            },
          },
        ],
      },
      select: {
        major: true,
      },
      distinct: ['major'],
    });

    return majors
      .map(item => item.major)
      .filter((major): major is string => major !== null && major !== '')
      .sort();
  }

  /**
   * 获取所有年份列表
   */
  async getYears(): Promise<number[]> {
    const years = await this.db.graduationTopic.findMany({
      where: {
        year: {
          not: null,
        },
      },
      select: {
        year: true,
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc',
      },
    });

    return years
      .map(item => item.year)
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a);
  }

  /**
   * 根据专业获取相关年份
   */
  async getYearsByMajor(major: string): Promise<number[]> {
    const years = await this.db.graduationTopic.findMany({
      where: {
        major,
        year: {
          not: null,
        },
      },
      select: {
        year: true,
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc',
      },
    });

    return years
      .map(item => item.year)
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a);
  }

  /**
   * 统计专业下的题目数量
   */
  async getTopicCountByMajor(major: string): Promise<number> {
    return await this.db.graduationTopic.count({
      where: {
        major,
      },
    });
  }

  /**
   * 统计年份下的题目数量
   */
  async getTopicCountByYear(year: number): Promise<number> {
    return await this.db.graduationTopic.count({
      where: {
        year,
      },
    });
  }

  /**
   * 保存生成会话
   */
  async saveGenerationSession(result: GenerationResult): Promise<string> {
    try {
      // 设置过期时间为7天后
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = await this.db.generationSession.create({
        data: {
          topics: JSON.stringify(result.topics),
          algorithm: result.algorithm,
          params: JSON.stringify(result.params || {}),
          stats: JSON.stringify(result.stats),
          expiresAt,
        },
      });

      return session.id;
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
      const session = await this.db.generationSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return null;
      }

      // 检查是否过期
      if (session.expiresAt < new Date()) {
        // 删除过期的会话
        await this.db.generationSession.delete({
          where: { id: sessionId },
        });
        return null;
      }

      return {
        topics: JSON.parse(session.topics as string) as string[],
        algorithm: session.algorithm,
        params: JSON.parse(session.params as string) as GenerationParams,
        stats: JSON.parse(session.stats as string) as GenerationResult['stats'],
      };
    } catch (error) {
      console.error('获取生成会话失败:', error);
      return null;
    }
  }

  /**
   * 获取最近的生成历史记录
   */
  async getRecentGenerationSessions(limit: number = 10): Promise<
    Array<{
      id: string;
      algorithm: string;
      params: GenerationParams;
      stats: GenerationResult['stats'];
      createdAt: Date;
      topicCount: number;
    }>
  > {
    try {
      const sessions = await this.db.generationSession.findMany({
        where: {
          expiresAt: {
            gt: new Date(), // 只获取未过期的会话
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          algorithm: true,
          params: true,
          stats: true,
          topics: true,
          createdAt: true,
        },
      });

      return sessions.map(session => {
        const topics = JSON.parse(session.topics as string) as string[];
        return {
          id: session.id,
          algorithm: session.algorithm,
          params: JSON.parse(session.params as string) as GenerationParams,
          stats: JSON.parse(
            session.stats as string
          ) as GenerationResult['stats'],
          createdAt: session.createdAt,
          topicCount: topics.length,
        };
      });
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
      const result = await this.db.generationSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      return 0;
    }
  }
}

export const dataService = new DataService();
