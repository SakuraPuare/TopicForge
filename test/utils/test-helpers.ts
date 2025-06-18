/**
 * 测试辅助工具函数
 */

import { PrismaClient } from '@prisma/client';

/**
 * 创建测试用的Prisma客户端
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db',
      },
    },
  });
}

/**
 * 清理测试数据库
 */
export async function cleanTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.generatedTopic.deleteMany();
  await prisma.graduationTopic.deleteMany();
  await prisma.markovChain.deleteMany();
  await prisma.keywordStats.deleteMany();
  await prisma.major.deleteMany();
}

/**
 * 创建测试用的毕业设计题目数据
 */
export function createTestGraduationTopics() {
  return [
    {
      title: '基于深度学习的图像识别系统设计与实现',
      major: '计算机科学与技术',
      school: '测试大学',
      year: 2024,
      processed: true,
    },
    {
      title: '大数据环境下的智能推荐算法研究',
      major: '计算机科学与技术',
      school: '测试大学',
      year: 2024,
      processed: true,
    },
    {
      title: '面向移动端的在线教育平台设计',
      major: '软件工程',
      school: '测试大学',
      year: 2024,
      processed: false,
    },
    {
      title: '区块链技术在供应链管理中的应用研究',
      major: '计算机科学与技术',
      school: '测试大学',
      year: 2024,
      processed: true,
    },
    {
      title: '人工智能在医疗诊断中的应用',
      major: '计算机科学与技术',
      school: '测试大学',
      year: 2024,
      processed: true,
    },
  ];
}

/**
 * 创建测试用的专业数据
 */
export function createTestMajors() {
  return [
    {
      name: '计算机科学与技术',
      displayName: '计算机科学与技术',
      category: '工学',
      description: '计算机科学与技术专业',
      sampleCount: 50,
      hasModel: true,
    },
    {
      name: '软件工程',
      displayName: '软件工程',
      category: '工学',
      description: '软件工程专业',
      sampleCount: 30,
      hasModel: false,
    },
    {
      name: '人工智能',
      displayName: '人工智能',
      category: '工学',
      description: '人工智能专业',
      sampleCount: 25,
      hasModel: true,
    },
  ];
}

/**
 * 等待指定时间
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 验证题目质量的辅助函数
 */
export function validateTopicQuality(topic: string): boolean {
  if (!topic || topic.length < 8) return false;
  if (topic.length > 50) return false;

  // 检查是否包含中文字符
  if (!/[\u4e00-\u9fa5]/.test(topic)) return false;

  // 检查是否包含基本的技术词汇或结构词汇
  const hasBasicTerms =
    /(系统|算法|技术|平台|应用|研究|设计|实现|分析|方法|模型)/.test(topic);
  if (!hasBasicTerms) return false;

  // 检查是否重复词汇过多
  const words = topic.split(/[的在与及和或]/);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length * 0.7) return false;

  return true;
}

/**
 * 生成随机测试数据
 */
export function generateRandomTestTopics(count: number): string[] {
  const prefixes = ['基于', '面向', '针对'];
  const technologies = ['深度学习', '机器学习', '人工智能', '大数据', '区块链'];
  const domains = ['医疗', '教育', '金融', '电商', '物流'];
  const systems = ['系统', '平台', '框架', '算法'];
  const actions = ['设计', '研究', '实现', '优化', '分析'];

  const topics: string[] = [];

  for (let i = 0; i < count; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const tech = technologies[Math.floor(Math.random() * technologies.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const system = systems[Math.floor(Math.random() * systems.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const topic = `${prefix}${tech}的${domain}${system}${action}与实现`;
    topics.push(topic);
  }

  return topics;
}

/**
 * 模拟延迟操作
 */
export async function mockAsyncOperation<T>(
  result: T,
  delay: number = 100
): Promise<T> {
  await sleep(delay);
  return result;
}
