import { PrismaClient } from '@prisma/client';
import { MajorInfo } from '../interfaces/generation';
import { MAJOR_SPECIFIC_TECH_DICT } from '../constants/tech-dict';

const prisma = new PrismaClient();

/**
 * 专业管理服务类
 */
export class MajorService {
  /**
   * 获取所有可用专业
   * @returns 专业信息数组
   */
  async getAvailableMajors(): Promise<MajorInfo[]> {
    try {
      // 从题目表中获取实际存在的专业
      const topicMajors = await prisma.graduationTopic.groupBy({
        by: ['major'],
        _count: {
          major: true,
        },
        where: {
          major: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            major: 'desc',
          },
        },
      });

      // 从专业表中获取额外信息
      const majorInfos = await prisma.major.findMany();
      const majorInfoMap = new Map(majorInfos.map(m => [m.name, m]));

      return topicMajors
        .filter(m => m.major !== null)
        .map(m => {
          const majorInfo = majorInfoMap.get(m.major!);
          return {
            major: m.major!,
            count: m._count.major,
            sampleCount: majorInfo?.sampleCount || 0,
            hasModel: majorInfo?.hasModel || false,
            lastTrainingTime: majorInfo?.lastTrainingAt || undefined,
            qualityStats: majorInfo?.qualityStats
              ? JSON.parse(majorInfo.qualityStats as string)
              : undefined,
          };
        });
    } catch (error) {
      console.error('获取专业列表失败:', error);
      return [];
    }
  }

  /**
   * 获取指定专业的详细信息
   * @param majorName 专业名称
   * @returns 专业信息
   */
  async getMajorInfo(majorName: string): Promise<MajorInfo | null> {
    try {
      // 从题目表中获取样本数量
      const topicCount = await prisma.graduationTopic.count({
        where: {
          major: majorName,
        },
      });

      const processedCount = await prisma.graduationTopic.count({
        where: {
          major: majorName,
          processed: true,
        },
      });

      // 从专业表中获取详细信息
      const majorInfo = await prisma.major.findUnique({
        where: { name: majorName },
      });

      return {
        major: majorName,
        count: topicCount,
        sampleCount: processedCount,
        hasModel: majorInfo?.hasModel || false,
        lastTrainingTime: majorInfo?.lastTrainingAt || undefined,
        qualityStats: majorInfo?.qualityStats
          ? JSON.parse(majorInfo.qualityStats as string)
          : undefined,
      };
    } catch (error) {
      console.error('获取专业信息失败:', error);
      return null;
    }
  }

  /**
   * 更新专业信息
   * @param majorName 专业名称
   * @param updates 更新内容
   */
  async updateMajorInfo(
    majorName: string,
    updates: {
      sampleCount?: number;
      hasModel?: boolean;
      lastTrainingAt?: Date;
      qualityStats?: {
        high: number;
        medium: number;
        low: number;
      };
      keywords?: string[];
    }
  ): Promise<void> {
    try {
      await prisma.major.upsert({
        where: { name: majorName },
        update: {
          sampleCount: updates.sampleCount,
          hasModel: updates.hasModel,
          lastTrainingAt: updates.lastTrainingAt,
          qualityStats: updates.qualityStats
            ? JSON.stringify(updates.qualityStats)
            : undefined,
          keywords: updates.keywords
            ? JSON.stringify(updates.keywords)
            : undefined,
          updatedAt: new Date(),
        },
        create: {
          name: majorName,
          displayName: this.generateDisplayName(majorName),
          category: this.categorizeByName(majorName),
          description: this.generateDescription(majorName),
          sampleCount: updates.sampleCount || 0,
          hasModel: updates.hasModel || false,
          lastTrainingAt: updates.lastTrainingAt,
          qualityStats: updates.qualityStats
            ? JSON.stringify(updates.qualityStats)
            : undefined,
          keywords: updates.keywords
            ? JSON.stringify(updates.keywords)
            : JSON.stringify(this.getDefaultKeywords(majorName)),
        },
      });
    } catch (error) {
      console.error('更新专业信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取专业的默认关键词
   * @param majorName 专业名称
   * @returns 关键词数组
   */
  getDefaultKeywords(majorName: string): string[] {
    return MAJOR_SPECIFIC_TECH_DICT[majorName] || [];
  }

  /**
   * 根据专业名称生成显示名称
   * @param majorName 专业名称
   * @returns 显示名称
   */
  private generateDisplayName(majorName: string): string {
    const displayNameMap: Record<string, string> = {
      计算机科学与技术: '计算机科学与技术',
      软件工程: '软件工程',
      网络工程: '网络工程',
      信息安全: '信息安全',
      数据科学与大数据技术: '数据科学与大数据技术',
      人工智能: '人工智能',
    };

    return displayNameMap[majorName] || majorName;
  }

  /**
   * 根据专业名称分类
   * @param majorName 专业名称
   * @returns 专业类别
   */
  private categorizeByName(majorName: string): string {
    const categoryMap: Record<string, string> = {
      计算机科学与技术: '计算机类',
      软件工程: '计算机类',
      网络工程: '计算机类',
      信息安全: '计算机类',
      数据科学与大数据技术: '数据科学类',
      人工智能: '人工智能类',
    };

    return categoryMap[majorName] || '其他';
  }

  /**
   * 根据专业名称生成描述
   * @param majorName 专业名称
   * @returns 专业描述
   */
  private generateDescription(majorName: string): string {
    const descriptionMap: Record<string, string> = {
      计算机科学与技术:
        '计算机硬件与软件相结合、面向系统、侧重应用的宽口径专业',
      软件工程: '研究用工程化方法构建和维护有效的、实用的和高质量的软件的学科',
      网络工程: '培养计算机网络系统的规划、设计和维护的专业技术人才',
      信息安全: '保障信息安全，涉及密码学、网络安全、系统安全等领域',
      数据科学与大数据技术:
        '以数据为核心，运用数学、统计学、计算机等交叉学科的理论与方法',
      人工智能:
        '研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统',
    };

    return descriptionMap[majorName] || `${majorName}相关专业`;
  }

  /**
   * 批量同步专业信息
   * @returns 同步结果
   */
  async syncMajorInfoFromTopics(): Promise<{
    updated: number;
    created: number;
  }> {
    try {
      console.log('开始同步专业信息...');

      const majors = await this.getAvailableMajors();
      let updated = 0;
      let created = 0;

      for (const major of majors) {
        const existingMajor = await prisma.major.findUnique({
          where: { name: major.major },
        });

        if (existingMajor) {
          await prisma.major.update({
            where: { name: major.major },
            data: {
              sampleCount: major.sampleCount,
              updatedAt: new Date(),
            },
          });
          updated++;
        } else {
          await prisma.major.create({
            data: {
              name: major.major,
              displayName: this.generateDisplayName(major.major),
              category: this.categorizeByName(major.major),
              description: this.generateDescription(major.major),
              sampleCount: major.sampleCount,
              keywords: JSON.stringify(this.getDefaultKeywords(major.major)),
            },
          });
          created++;
        }
      }

      console.log(`专业信息同步完成: 更新 ${updated} 个，创建 ${created} 个`);
      return { updated, created };
    } catch (error) {
      console.error('同步专业信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查专业是否有足够的样本进行训练
   * @param majorName 专业名称
   * @param minSamples 最小样本数
   * @returns 是否有足够样本
   */
  async hasSufficientSamples(
    majorName: string,
    minSamples: number = 10
  ): Promise<boolean> {
    try {
      const count = await prisma.graduationTopic.count({
        where: {
          major: majorName,
          processed: true,
        },
      });

      return count >= minSamples;
    } catch (error) {
      console.error('检查专业样本数量失败:', error);
      return false;
    }
  }

  /**
   * 获取专业的质量统计
   * @param majorName 专业名称
   * @returns 质量统计信息
   */
  async getMajorQualityStats(majorName: string): Promise<{
    high: number;
    medium: number;
    low: number;
  } | null> {
    try {
      const majorInfo = await prisma.major.findUnique({
        where: { name: majorName },
      });

      if (majorInfo?.qualityStats) {
        return JSON.parse(majorInfo.qualityStats as string);
      }

      return null;
    } catch (error) {
      console.error('获取专业质量统计失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const majorService = new MajorService();
