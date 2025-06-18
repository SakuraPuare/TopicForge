import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ImportStats {
  graduationTopics: number;
  majors: number;
  keywordStats: number;
  markovChains: number;
  majorMarkovChains: number;
}

/**
 * 导入种子数据到数据库
 */
async function importSeeds(useSample = true) {
  console.log('🚀 开始导入种子数据...\n');

  const stats: ImportStats = {
    graduationTopics: 0,
    majors: 0,
    keywordStats: 0,
    markovChains: 0,
    majorMarkovChains: 0,
  };

  try {
    const seedsDir = path.join(process.cwd(), 'data', 'seeds');

    if (!fs.existsSync(seedsDir)) {
      throw new Error(`种子数据目录不存在: ${seedsDir}`);
    }

    // 检查是否已有数据
    const existingTopics = await prisma.graduationTopic.count();
    if (existingTopics > 0) {
      console.log(`⚠️  数据库中已存在 ${existingTopics} 条毕业设计题目数据`);
      const confirm = process.argv.includes('--force');
      if (!confirm) {
        console.log('使用 --force 参数强制导入，或先清空数据库');
        return;
      }
      console.log('🗑️  正在清空现有数据...');
      await clearExistingData();
    }

    // 1. 导入专业数据
    await importMajors(seedsDir, stats);

    // 2. 导入毕业设计题目数据
    await importGraduationTopics(seedsDir, stats, useSample);

    // 3. 导入关键词统计
    await importKeywordStats(seedsDir, stats);

    // 4. 导入马尔可夫链数据
    await importMarkovChains(seedsDir, stats);

    // 5. 导入专业马尔可夫链数据
    await importMajorMarkovChains(seedsDir, stats);

    console.log('\n✅ 种子数据导入完成！');
    console.log('\n📊 导入统计:');
    console.log(
      `   毕业设计题目: ${stats.graduationTopics.toLocaleString()} 条`
    );
    console.log(`   专业数据: ${stats.majors} 条`);
    console.log(`   关键词统计: ${stats.keywordStats.toLocaleString()} 条`);
    console.log(`   马尔可夫链: ${stats.markovChains.toLocaleString()} 条`);
    console.log(
      `   专业马尔可夫链: ${stats.majorMarkovChains.toLocaleString()} 条`
    );

    console.log('\n🎉 现在您可以开始使用TopicForge生成选题了！');
    console.log(
      '💡 运行 `npm run train` 来训练模型，然后访问 http://localhost:3000/generate'
    );
  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 清空现有数据
 */
async function clearExistingData() {
  await prisma.majorMarkovChain.deleteMany();
  await prisma.markovChain.deleteMany();
  await prisma.keywordStats.deleteMany();
  await prisma.tokenizedWord.deleteMany();
  await prisma.graduationTopic.deleteMany();
  await prisma.major.deleteMany();
  console.log('   ✓ 已清空现有数据');
}

/**
 * 导入专业数据
 */
async function importMajors(seedsDir: string, stats: ImportStats) {
  console.log('🎓 导入专业数据...');
  const filePath = path.join(seedsDir, 'majors.json');

  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  专业数据文件不存在，跳过');
    return;
  }

  const majors = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 使用批量插入
  await prisma.major.createMany({
    data: majors,
  });

  stats.majors = majors.length;
  console.log(`   ✓ 已导入 ${majors.length} 条专业数据`);
}

/**
 * 导入毕业设计题目数据
 */
async function importGraduationTopics(
  seedsDir: string,
  stats: ImportStats,
  useSample: boolean
) {
  console.log('📚 导入毕业设计题目数据...');

  const fileName = useSample
    ? 'graduation-topics-sample.json'
    : 'graduation-topics.json';
  const filePath = path.join(seedsDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  题目数据文件不存在: ${fileName}，跳过`);
    return;
  }

  const topics = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 批量导入，每次1000条
  const batchSize = 1000;
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    await prisma.graduationTopic.createMany({
      data: batch,
    });
    console.log(
      `   ✓ 已导入 ${Math.min(i + batchSize, topics.length)}/${topics.length} 条题目数据`
    );
  }

  stats.graduationTopics = topics.length;
}

/**
 * 导入关键词统计
 */
async function importKeywordStats(seedsDir: string, stats: ImportStats) {
  console.log('🔍 导入关键词统计数据...');
  const filePath = path.join(seedsDir, 'keyword-stats.json');

  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  关键词统计文件不存在，跳过');
    return;
  }

  const keywordStats = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 批量导入
  const batchSize = 1000;
  for (let i = 0; i < keywordStats.length; i += batchSize) {
    const batch = keywordStats.slice(i, i + batchSize);
    await prisma.keywordStats.createMany({
      data: batch,
    });
    console.log(
      `   ✓ 已导入 ${Math.min(i + batchSize, keywordStats.length)}/${keywordStats.length} 条关键词统计`
    );
  }

  stats.keywordStats = keywordStats.length;
}

/**
 * 导入马尔可夫链数据
 */
async function importMarkovChains(seedsDir: string, stats: ImportStats) {
  console.log('🔗 导入马尔可夫链数据...');
  const filePath = path.join(seedsDir, 'markov-chains.json');

  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  马尔可夫链文件不存在，跳过');
    return;
  }

  const markovChains = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 批量导入
  const batchSize = 1000;
  for (let i = 0; i < markovChains.length; i += batchSize) {
    const batch = markovChains.slice(i, i + batchSize);
    await prisma.markovChain.createMany({
      data: batch,
    });
    console.log(
      `   ✓ 已导入 ${Math.min(i + batchSize, markovChains.length)}/${markovChains.length} 条马尔可夫链`
    );
  }

  stats.markovChains = markovChains.length;
}

/**
 * 导入专业马尔可夫链数据
 */
async function importMajorMarkovChains(seedsDir: string, stats: ImportStats) {
  console.log('🎯 导入专业马尔可夫链数据...');
  const filePath = path.join(seedsDir, 'major-markov-chains.json');

  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  专业马尔可夫链文件不存在，跳过');
    return;
  }

  const majorMarkovChains = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 批量导入
  const batchSize = 1000;
  for (let i = 0; i < majorMarkovChains.length; i += batchSize) {
    const batch = majorMarkovChains.slice(i, i + batchSize);
    await prisma.majorMarkovChain.createMany({
      data: batch,
    });
    console.log(
      `   ✓ 已导入 ${Math.min(i + batchSize, majorMarkovChains.length)}/${majorMarkovChains.length} 条专业马尔可夫链`
    );
  }

  stats.majorMarkovChains = majorMarkovChains.length;
}

// 执行导入
if (require.main === module) {
  const useSample = !process.argv.includes('--full');
  const dataType = useSample ? '样例数据' : '完整数据';

  console.log(`📦 导入模式: ${dataType}`);
  console.log(
    '💡 使用 --full 参数导入完整数据，--force 参数强制覆盖现有数据\n'
  );

  importSeeds(useSample).catch(error => {
    console.error('导入失败:', error);
    process.exit(1);
  });
}

export { importSeeds };
