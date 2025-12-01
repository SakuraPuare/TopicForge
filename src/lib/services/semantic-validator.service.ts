import { PrismaClient } from '@prisma/client';
import { textProcessor } from './text-processor.service';

const prisma = new PrismaClient();

/**
 * 领域分类定义
 */
export interface DomainCategory {
  name: string;
  keywords: Set<string>;
  weight: number; // 领域权重
}

/**
 * 语义验证结果
 */
export interface SemanticValidationResult {
  isValid: boolean;
  score: number; // 0-1 之间的分数
  issues: string[];
  domainDistribution: Map<string, number>; // 领域分布
}

/**
 * 语义验证器服务
 * 用于检测生成题目的语义连贯性和领域一致性
 */
export class SemanticValidatorService {
  // 领域词汇映射（从数据库动态加载）
  private domainCategories: Map<string, DomainCategory> = new Map();
  private isLoaded = false;

  // 预定义的领域分类
  private readonly DOMAIN_NAMES = [
    '技术开发',
    '数据分析',
    '人工智能',
    '网络安全',
    '软件工程',
    '数据库',
    '前端开发',
    '后端开发',
    '移动开发',
    '云计算',
    '物联网',
    '区块链',
    '其他',
  ];

  /**
   * 从数据库加载领域词汇映射
   */
  async loadDomainKeywords(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      console.log('从数据库加载领域词汇映射...');

      // 获取所有关键词及其分类
      const keywordStats = await prisma.keywordStats.findMany({
        where: {
          category: { not: null },
        },
        select: {
          keyword: true,
          category: true,
          frequency: true,
        },
      });

      // 按分类分组关键词
      const categoryMap = new Map<string, Set<string>>();

      keywordStats.forEach(stat => {
        if (stat.category) {
          if (!categoryMap.has(stat.category)) {
            categoryMap.set(stat.category, new Set());
          }
          categoryMap.get(stat.category)!.add(stat.keyword);
        }
      });

      // 构建领域分类对象
      categoryMap.forEach((keywords, categoryName) => {
        // 将分类名称映射到标准领域名称
        const domainName = this.mapCategoryToDomain(categoryName);

        if (!this.domainCategories.has(domainName)) {
          this.domainCategories.set(domainName, {
            name: domainName,
            keywords: new Set(),
            weight: 1.0,
          });
        }

        // 合并关键词
        keywords.forEach(keyword => {
          this.domainCategories.get(domainName)!.keywords.add(keyword);
        });
      });

      // 如果没有从数据库加载到数据，使用默认映射
      if (this.domainCategories.size === 0) {
        this.initializeDefaultDomains();
      }

      this.isLoaded = true;
      console.log(
        `✅ 领域词汇映射加载完成: ${this.domainCategories.size} 个领域`
      );
    } catch (error) {
      console.warn('加载领域词汇映射失败，使用默认映射:', error);
      this.initializeDefaultDomains();
      this.isLoaded = true;
    }
  }

  /**
   * 将数据库分类名称映射到标准领域名称
   */
  private mapCategoryToDomain(categoryName: string): string {
    const lowerCategory = categoryName.toLowerCase();

    // 技术开发相关
    if (
      lowerCategory.includes('开发') ||
      lowerCategory.includes('编程') ||
      lowerCategory.includes('软件')
    ) {
      return '技术开发';
    }

    // 数据分析相关
    if (
      lowerCategory.includes('数据') ||
      lowerCategory.includes('分析') ||
      lowerCategory.includes('统计')
    ) {
      return '数据分析';
    }

    // 人工智能相关
    if (
      lowerCategory.includes('智能') ||
      lowerCategory.includes('学习') ||
      lowerCategory.includes('算法') ||
      lowerCategory.includes('神经网络')
    ) {
      return '人工智能';
    }

    // 网络安全相关
    if (
      lowerCategory.includes('安全') ||
      lowerCategory.includes('加密') ||
      lowerCategory.includes('防护')
    ) {
      return '网络安全';
    }

    // 默认返回其他
    return '其他';
  }

  /**
   * 初始化默认领域映射（当数据库中没有数据时使用）
   */
  private initializeDefaultDomains(): void {
    const defaultDomains: Record<string, string[]> = {
      技术开发: [
        '开发',
        '实现',
        '设计',
        '系统',
        '平台',
        '框架',
        '架构',
        '应用',
        '软件',
        '程序',
      ],
      数据分析: [
        '数据',
        '分析',
        '挖掘',
        '处理',
        '统计',
        '可视化',
        '预测',
        '模型',
        '算法',
      ],
      人工智能: [
        '智能',
        '学习',
        '神经网络',
        '深度学习',
        '机器学习',
        '识别',
        '分类',
        '预测',
        '优化',
      ],
      网络安全: [
        '安全',
        '加密',
        '防护',
        '漏洞',
        '攻击',
        '防御',
        '认证',
        '授权',
      ],
      软件工程: ['工程', '管理', '流程', '质量', '测试', '部署', '维护'],
      数据库: ['数据库', '存储', '查询', '索引', '事务', '备份'],
      前端开发: ['前端', '界面', '交互', '响应式', '组件', 'UI', 'UX'],
      后端开发: ['后端', '服务', 'API', '接口', '服务器', '微服务'],
      移动开发: ['移动', '手机', 'APP', 'Android', 'iOS', '跨平台'],
      云计算: ['云', '计算', '虚拟化', '容器', '分布式', '集群'],
      物联网: ['物联网', '传感器', '设备', '连接', '监控'],
      区块链: ['区块链', '分布式', '共识', '智能合约', '去中心化'],
    };

    Object.entries(defaultDomains).forEach(([name, keywords]) => {
      this.domainCategories.set(name, {
        name,
        keywords: new Set(keywords),
        weight: 1.0,
      });
    });
  }

  /**
   * 验证生成题目的语义连贯性
   * @param topic 题目文本
   * @returns 验证结果
   */
  async validateTopic(topic: string): Promise<SemanticValidationResult> {
    // 确保已加载领域词汇
    if (!this.isLoaded) {
      await this.loadDomainKeywords();
    }

    const issues: string[] = [];
    const domainDistribution = new Map<string, number>();

    // 处理题目，提取关键词
    const processed = textProcessor.batchProcess([topic])[0];
    const keywords = processed.keywords;
    const tokens = processed.tokens;

    if (keywords.length === 0) {
      return {
        isValid: false,
        score: 0,
        issues: ['题目中没有检测到有效关键词'],
        domainDistribution,
      };
    }

    // 计算每个领域的匹配度
    let totalMatches = 0;
    const domainMatches = new Map<string, number>();

    keywords.forEach(keyword => {
      this.domainCategories.forEach((domain, domainName) => {
        if (domain.keywords.has(keyword)) {
          const currentMatches = domainMatches.get(domainName) || 0;
          domainMatches.set(domainName, currentMatches + 1);
          totalMatches++;
        }
      });
    });

    // 计算领域分布
    domainMatches.forEach((matches, domainName) => {
      const distribution = matches / keywords.length;
      domainDistribution.set(domainName, distribution);
    });

    // 检测跨领域混乱（超过 2 个主要领域）
    const significantDomains = Array.from(domainDistribution.entries())
      .filter(([, dist]) => dist >= 0.2) // 占比超过 20% 的领域
      .map(([name]) => name);

    if (significantDomains.length > 2) {
      issues.push(
        `检测到跨领域混乱：涉及 ${significantDomains.length} 个主要领域 (${significantDomains.join(', ')})`
      );
    }

    // 检查结构完整性
    if (tokens.length < 4) {
      issues.push('题目过短，可能缺乏完整性');
    }

    if (tokens.length > 20) {
      issues.push('题目过长，可能包含冗余信息');
    }

    // 计算语义连贯性分数
    let score = 0.5; // 基础分数

    // 如果有明确的领域匹配，提高分数
    if (significantDomains.length >= 1 && significantDomains.length <= 2) {
      score += 0.3;
    }

    // 如果关键词匹配度高，提高分数
    const matchRatio = totalMatches / keywords.length;
    score += matchRatio * 0.2;

    // 如果有问题，降低分数
    score -= issues.length * 0.1;

    score = Math.max(0, Math.min(1, score)); // 限制在 0-1 之间

    const isValid = score >= 0.5 && issues.length <= 1;

    return {
      isValid,
      score,
      issues,
      domainDistribution,
    };
  }

  /**
   * 批量验证题目
   * @param topics 题目数组
   * @returns 验证结果数组
   */
  async validateTopics(topics: string[]): Promise<SemanticValidationResult[]> {
    return Promise.all(topics.map(topic => this.validateTopic(topic)));
  }

  /**
   * 获取领域分类信息
   */
  getDomainCategories(): Map<string, DomainCategory> {
    return new Map(this.domainCategories);
  }
}

// 导出单例实例
export const semanticValidator = new SemanticValidatorService();
