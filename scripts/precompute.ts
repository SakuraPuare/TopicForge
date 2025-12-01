#!/usr/bin/env tsx

/**
 * 预处理脚本 - 构建专业类别映射和预计算模型数据
 */

import { PrismaClient } from '@prisma/client';
import { textProcessor } from '../src/lib/services/text-processor.service';

const prisma = new PrismaClient();

// 配置常量
const CONFIG = {
  majorMinSamples: 50, // 专业模型最小样本数
  categoryMinSamples: 30, // 类别模型最小样本数
  qualityThreshold: 0.5, // 默认质量阈值
  lowSampleQualityPenalty: 0.8, // 低样本专业质量惩罚系数
  highFreqWordsLimit: 50, // 高频词数量限制
};

// 专业类别自动分类规则
const CATEGORY_RULES = [
  {
    keywords: ['计算机', '软件', '网络', '信息', '数据', '人工智能', '物联网'],
    category: '计算机类',
  },
  { keywords: ['化学', '化工', '材料'], category: '化工类' },
  { keywords: ['机械', '车辆', '汽车', '工业'], category: '机械类' },
  { keywords: ['电子', '通信', '自动化', '电气'], category: '电子信息类' },
  {
    keywords: ['土木', '建筑', '工程管理', '工程造价'],
    category: '土木建筑类',
  },
  { keywords: ['生物', '食品'], category: '生物食品类' },
  {
    keywords: ['经济', '财务', '金融', '市场', '物流', '工商', '会计'],
    category: '经济管理类',
  },
  {
    keywords: ['英语', '日语', '汉语', '文学', '语言'],
    category: '文学语言类',
  },
  { keywords: ['法学', '法律', '社会'], category: '法学社会类' },
  { keywords: ['教育', '体育', '学前'], category: '教育类' },
  {
    keywords: ['设计', '绘画', '动画', '艺术', '视觉'],
    category: '艺术设计类',
  },
  {
    keywords: ['广播', '电视', '音乐', '舞蹈', '传媒', '编导'],
    category: '传媒艺术类',
  },
  { keywords: ['旅游', '地理', '酒店'], category: '旅游地理类' },
  { keywords: ['数学', '物理', '统计'], category: '数理类' },
  { keywords: ['护理', '医学', '药学', '临床'], category: '医药类' },
  { keywords: ['农', '林', '园艺', '植物'], category: '农林类' },
];

/**
 * 匹配专业类别
 */
function matchCategory(majorName: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => majorName.includes(kw))) {
      return rule.category;
    }
  }
  return '其他类';
}

/**
 * 初始化配置表
 */
async function initializeConfig() {
  console.log('📝 初始化配置表...');

  const configs = [
    {
      key: 'majorMinSamples',
      value: CONFIG.majorMinSamples,
      description: '专业模型最小样本数',
    },
    {
      key: 'categoryMinSamples',
      value: CONFIG.categoryMinSamples,
      description: '类别模型最小样本数',
    },
    {
      key: 'qualityThreshold',
      value: CONFIG.qualityThreshold,
      description: '默认质量阈值',
    },
    {
      key: 'lowSampleQualityPenalty',
      value: CONFIG.lowSampleQualityPenalty,
      description: '低样本专业质量惩罚系数',
    },
  ];

  for (const config of configs) {
    await prisma.generationConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
  }

  console.log(`   ✓ 已初始化 ${configs.length} 个配置项`);
}

/**
 * 构建专业类别映射
 */
async function buildMajorCategories() {
  console.log('\n🏷️  构建专业类别映射...');

  // 获取所有专业
  const majors = await prisma.graduationTopic.groupBy({
    by: ['major'],
    where: { major: { not: null } },
    _count: { major: true },
  });

  console.log(`   找到 ${majors.length} 个专业`);

  // 清空旧数据
  await prisma.majorCategory.deleteMany();

  // 分类统计
  const categoryStats: Record<string, number> = {};
  const mappings: Array<{ major: string; category: string }> = [];

  for (const item of majors) {
    if (!item.major) continue;

    const category = matchCategory(item.major);
    mappings.push({ major: item.major, category });

    categoryStats[category] = (categoryStats[category] || 0) + 1;
  }

  // 批量插入
  if (mappings.length > 0) {
    await prisma.majorCategory.createMany({
      data: mappings,
    });
  }

  console.log('   类别分布:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`     ${cat}: ${count} 个专业`);
    });

  console.log(`   ✓ 已创建 ${mappings.length} 个专业类别映射`);

  return mappings;
}

/**
 * 从题目中提取词汇统计
 */
function extractTokenStats(
  topics: Array<{ title: string; major?: string | null }>
) {
  const startTokenFreq: Record<string, number> = {};
  const endTokenFreq: Record<string, number> = {};
  const wordFreq: Record<string, number> = {};

  for (const topic of topics) {
    // 分词处理
    const processed = textProcessor.batchProcess([topic.title])[0];
    const tokens = processed.tokens;

    if (tokens.length === 0) continue;

    // 记录开始词
    const startToken = tokens[0];
    startTokenFreq[startToken] = (startTokenFreq[startToken] || 0) + 1;

    // 记录结束词
    const endToken = tokens[tokens.length - 1];
    endTokenFreq[endToken] = (endTokenFreq[endToken] || 0) + 1;

    // 记录所有词频
    for (const token of tokens) {
      wordFreq[token] = (wordFreq[token] || 0) + 1;
    }
  }

  // 排序并取 Top N
  const sortByFreq = (freq: Record<string, number>, limit: number = 100) =>
    Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);

  return {
    startTokens: sortByFreq(startTokenFreq, 30),
    endTokens: sortByFreq(endTokenFreq, 30),
    highFreqWords: sortByFreq(wordFreq, CONFIG.highFreqWordsLimit),
  };
}

/**
 * 预计算各级模型
 */
async function precomputeModels(
  majorCategories: Array<{ major: string; category: string }>
) {
  console.log('\n🔮 预计算模型数据...');

  // 清空旧数据
  await prisma.precomputedModel.deleteMany();

  // 获取专业类别映射
  const categoryMap = new Map(majorCategories.map(m => [m.major, m.category]));

  // 获取所有专业的统计信息
  const majorStats = await prisma.graduationTopic.groupBy({
    by: ['major'],
    where: { major: { not: null } },
    _count: { major: true },
  });

  // 获取马尔科夫链统计
  const markovStats = await prisma.majorMarkovChain.groupBy({
    by: ['major'],
    _count: { id: true },
  });
  const markovCountMap = new Map(markovStats.map(s => [s.major, s._count.id]));

  // 类别聚合数据
  const categoryData: Record<
    string,
    {
      topics: Array<{ title: string; major?: string | null }>;
      sampleCount: number;
      stateCount: number;
      transitionCount: number;
    }
  > = {};

  // 全局聚合数据
  const globalTopics: Array<{ title: string; major?: string | null }> = [];
  let globalSampleCount = 0;

  console.log('   处理专业模型...');
  let processedCount = 0;

  for (const stat of majorStats) {
    if (!stat.major) continue;

    const majorName = stat.major;
    const sampleCount = stat._count.major;
    const stateCount = markovCountMap.get(majorName) || 0;
    const category = categoryMap.get(majorName) || '其他类';

    // 获取该专业的题目
    const topics = await prisma.graduationTopic.findMany({
      where: { major: majorName },
      select: { title: true, major: true },
    });

    // 提取词汇统计
    const tokenStats = extractTokenStats(topics);

    // 判断是否可用
    const isReady = sampleCount >= CONFIG.majorMinSamples;
    const fallbackTo = isReady ? null : category;

    // 计算转移总数
    const transitionCount = stateCount; // 简化：状态数约等于转移数

    // 写入专业模型
    await prisma.precomputedModel.create({
      data: {
        scope: 'major',
        name: majorName,
        startTokens: tokenStats.startTokens,
        endTokens: tokenStats.endTokens,
        highFreqWords: tokenStats.highFreqWords,
        sampleCount,
        stateCount,
        transitionCount,
        fallbackTo,
        isReady,
      },
    });

    // 聚合到类别
    if (!categoryData[category]) {
      categoryData[category] = {
        topics: [],
        sampleCount: 0,
        stateCount: 0,
        transitionCount: 0,
      };
    }
    categoryData[category].topics.push(...topics);
    categoryData[category].sampleCount += sampleCount;
    categoryData[category].stateCount += stateCount;
    categoryData[category].transitionCount += transitionCount;

    // 聚合到全局
    globalTopics.push(...topics);
    globalSampleCount += sampleCount;

    processedCount++;
    if (processedCount % 10 === 0) {
      console.log(
        `     已处理 ${processedCount}/${majorStats.length} 个专业...`
      );
    }
  }

  console.log(`   ✓ 已创建 ${processedCount} 个专业模型`);

  // 处理类别模型
  console.log('   处理类别模型...');
  let categoryCount = 0;

  for (const [category, data] of Object.entries(categoryData)) {
    const tokenStats = extractTokenStats(data.topics);
    const isReady = data.sampleCount >= CONFIG.categoryMinSamples;

    await prisma.precomputedModel.create({
      data: {
        scope: 'category',
        name: category,
        startTokens: tokenStats.startTokens,
        endTokens: tokenStats.endTokens,
        highFreqWords: tokenStats.highFreqWords,
        sampleCount: data.sampleCount,
        stateCount: data.stateCount,
        transitionCount: data.transitionCount,
        fallbackTo: isReady ? null : '_global',
        isReady,
      },
    });

    categoryCount++;
  }

  console.log(`   ✓ 已创建 ${categoryCount} 个类别模型`);

  // 处理全局模型
  console.log('   处理全局模型...');
  const globalTokenStats = extractTokenStats(globalTopics.slice(0, 5000)); // 限制处理数量

  // 获取通用马尔科夫链统计
  const generalMarkovCount = await prisma.markovChain.count();

  await prisma.precomputedModel.create({
    data: {
      scope: 'general',
      name: '_global',
      startTokens: globalTokenStats.startTokens,
      endTokens: globalTokenStats.endTokens,
      highFreqWords: globalTokenStats.highFreqWords,
      sampleCount: globalSampleCount,
      stateCount: generalMarkovCount,
      transitionCount: generalMarkovCount,
      fallbackTo: null,
      isReady: true,
    },
  });

  console.log('   ✓ 已创建全局模型');

  // 统计结果
  const readyMajors = await prisma.precomputedModel.count({
    where: { scope: 'major', isReady: true },
  });
  const totalMajors = await prisma.precomputedModel.count({
    where: { scope: 'major' },
  });

  console.log(`\n📊 预计算统计:`);
  console.log(`   可用专业模型: ${readyMajors}/${totalMajors}`);
  console.log(`   类别模型: ${categoryCount}`);
  console.log(`   全局模型: 1`);
}

/**
 * 更新回退路径（确保类别回退正确）
 */
async function updateFallbackPaths() {
  console.log('\n🔄 更新回退路径...');

  // 获取所有不可用的专业模型
  const notReadyMajors = await prisma.precomputedModel.findMany({
    where: { scope: 'major', isReady: false },
  });

  let updatedCount = 0;

  for (const major of notReadyMajors) {
    // 检查其类别模型是否可用
    const categoryModel = await prisma.precomputedModel.findFirst({
      where: { scope: 'category', name: major.fallbackTo || '', isReady: true },
    });

    if (!categoryModel && major.fallbackTo !== '_global') {
      // 类别模型不可用，直接回退到全局
      await prisma.precomputedModel.update({
        where: { id: major.id },
        data: { fallbackTo: '_global' },
      });
      updatedCount++;
    }
  }

  console.log(`   ✓ 更新了 ${updatedCount} 个回退路径`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始预处理...\n');
  const startTime = Date.now();

  try {
    // 1. 初始化配置
    await initializeConfig();

    // 2. 构建专业类别映射
    const majorCategories = await buildMajorCategories();

    // 3. 预计算模型
    await precomputeModels(majorCategories);

    // 4. 更新回退路径
    await updateFallbackPaths();

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ 预处理完成！耗时 ${(totalTime / 1000).toFixed(2)} 秒`);
  } catch (error) {
    console.error('❌ 预处理出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 导出供 train-model.ts 调用
export { main as precompute };

// 直接运行时执行（仅当作为主模块运行时）
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
