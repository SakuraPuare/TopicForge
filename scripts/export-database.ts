import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ExportStats {
  graduationTopics: number;
  majors: number;
  generatedTopics: number;
  keywordStats: number;
  markovChains: number;
  majorMarkovChains: number;
}

/**
 * 导出数据库数据为种子文件
 * 注意：会话数据 (generation_sessions) 不参与导出，因为这些是运行时临时数据
 */
async function exportDatabase() {
  console.log('�� 开始导出数据库数据...\n');
  console.log('⚠️  注意：会话数据 (generation_sessions) 不会被导出\n');

  const stats: ExportStats = {
    graduationTopics: 0,
    majors: 0,
    generatedTopics: 0,
    keywordStats: 0,
    markovChains: 0,
    majorMarkovChains: 0,
  };

  try {
    // 确保导出目录存在
    const exportDir = path.join(process.cwd(), 'data', 'exports');
    const seedsDir = path.join(process.cwd(), 'data', 'seeds');

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }

    // 1. 导出毕业设计题目数据
    console.log('📚 导出毕业设计题目数据...');
    const graduationTopics = await prisma.graduationTopic.findMany({
      orderBy: { createdAt: 'asc' },
    });
    stats.graduationTopics = graduationTopics.length;

    await writeJsonFile(
      path.join(exportDir, 'graduation-topics.json'),
      graduationTopics
    );

    // 创建精简版种子数据（前1000条用于快速初始化）
    const sampleTopics = graduationTopics.slice(0, 1000);
    await writeJsonFile(
      path.join(seedsDir, 'graduation-topics-sample.json'),
      sampleTopics
    );

    // 2. 导出专业数据
    console.log('🎓 导出专业数据...');
    const majors = await prisma.major.findMany({
      orderBy: { name: 'asc' },
    });
    stats.majors = majors.length;

    await writeJsonFile(path.join(exportDir, 'majors.json'), majors);
    await writeJsonFile(path.join(seedsDir, 'majors.json'), majors);

    // 3. 导出关键词统计
    console.log('🔍 导出关键词统计数据...');
    const keywordStats = await prisma.keywordStats.findMany({
      orderBy: { frequency: 'desc' },
      take: 5000, // 只导出前5000个高频关键词
    });
    stats.keywordStats = keywordStats.length;

    await writeJsonFile(
      path.join(exportDir, 'keyword-stats.json'),
      keywordStats
    );
    await writeJsonFile(
      path.join(seedsDir, 'keyword-stats.json'),
      keywordStats
    );

    // 4. 导出马尔可夫链数据（采样）
    console.log('🔗 导出马尔可夫链数据...');
    const markovChains = await prisma.markovChain.findMany({
      orderBy: { frequency: 'desc' },
      take: 10000, // 只导出前10000个高频链条
    });
    stats.markovChains = markovChains.length;

    await writeJsonFile(
      path.join(exportDir, 'markov-chains.json'),
      markovChains
    );
    await writeJsonFile(
      path.join(seedsDir, 'markov-chains.json'),
      markovChains
    );

    // 5. 导出专业特定马尔可夫链数据
    console.log('🎯 导出专业马尔可夫链数据...');
    const majorMarkovChains = await prisma.majorMarkovChain.findMany({
      orderBy: { frequency: 'desc' },
      take: 10000,
    });
    stats.majorMarkovChains = majorMarkovChains.length;

    await writeJsonFile(
      path.join(exportDir, 'major-markov-chains.json'),
      majorMarkovChains
    );
    await writeJsonFile(
      path.join(seedsDir, 'major-markov-chains.json'),
      majorMarkovChains
    );

    // 6. 导出生成的题目样例
    console.log('✨ 导出生成题目样例...');
    const generatedTopics = await prisma.generatedTopic.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // 只导出最近100个生成的题目
    });
    stats.generatedTopics = generatedTopics.length;

    await writeJsonFile(
      path.join(exportDir, 'generated-topics.json'),
      generatedTopics
    );

    // 7. 创建导出元数据
    const metadata = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      description: 'TopicForge 数据库导出数据',
      stats,
      files: {
        full: {
          'graduation-topics.json': `完整的毕业设计题目数据 (${stats.graduationTopics} 条)`,
          'majors.json': `专业数据 (${stats.majors} 条)`,
          'keyword-stats.json': `关键词统计数据 (${stats.keywordStats} 条)`,
          'markov-chains.json': `马尔可夫链数据 (${stats.markovChains} 条)`,
          'major-markov-chains.json': `专业马尔可夫链数据 (${stats.majorMarkovChains} 条)`,
          'generated-topics.json': `生成题目样例 (${stats.generatedTopics} 条)`,
        },
        seeds: {
          'graduation-topics-sample.json': '毕业设计题目样例数据 (1000 条)',
          'majors.json': `专业数据 (${stats.majors} 条)`,
          'keyword-stats.json': `关键词统计数据 (${stats.keywordStats} 条)`,
          'markov-chains.json': `马尔可夫链数据 (${stats.markovChains} 条)`,
          'major-markov-chains.json': `专业马尔可夫链数据 (${stats.majorMarkovChains} 条)`,
        },
      },
    };

    await writeJsonFile(path.join(exportDir, 'metadata.json'), metadata);
    await writeJsonFile(path.join(seedsDir, 'metadata.json'), metadata);

    // 8. 创建SQL导出（用于其他数据库）
    console.log('💾 创建SQL导出文件...');
    await createSqlExport(exportDir);

    console.log('\n✅ 数据导出完成！');
    console.log('\n📊 导出统计:');
    console.log(
      `   毕业设计题目: ${stats.graduationTopics.toLocaleString()} 条`
    );
    console.log(`   专业数据: ${stats.majors} 条`);
    console.log(`   关键词统计: ${stats.keywordStats.toLocaleString()} 条`);
    console.log(`   马尔可夫链: ${stats.markovChains.toLocaleString()} 条`);
    console.log(
      `   专业马尔可夫链: ${stats.majorMarkovChains.toLocaleString()} 条`
    );
    console.log(`   生成题目样例: ${stats.generatedTopics} 条`);

    console.log('\n📁 导出文件位置:');
    console.log(`   完整数据: ./data/exports/`);
    console.log(`   种子数据: ./data/seeds/`);
  } catch (error) {
    console.error('❌ 导出过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 写入JSON文件
 */
async function writeJsonFile(filePath: string, data: unknown) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonString, 'utf8');

  const sizeInMB = (
    Buffer.byteLength(jsonString, 'utf8') /
    1024 /
    1024
  ).toFixed(2);
  console.log(`   ✓ ${path.basename(filePath)} (${sizeInMB}MB)`);
}

/**
 * 创建SQL导出文件
 */
async function createSqlExport(exportDir: string) {
  const sqlFile = path.join(exportDir, 'topicforge-data.sql');
  let sqlContent = '';

  // 添加文件头注释
  sqlContent += `-- TopicForge 数据库导出\n`;
  sqlContent += `-- 导出时间: ${new Date().toISOString()}\n`;
  sqlContent += `-- 版本: 1.0.0\n\n`;

  // 清空表（可选）
  sqlContent += `-- 清空现有数据（取消注释以使用）\n`;
  sqlContent += `-- DELETE FROM major_markov_chains;\n`;
  sqlContent += `-- DELETE FROM markov_chains;\n`;
  sqlContent += `-- DELETE FROM keyword_stats;\n`;
  sqlContent += `-- DELETE FROM tokenized_words;\n`;
  sqlContent += `-- DELETE FROM graduation_topics;\n`;
  sqlContent += `-- DELETE FROM majors;\n\n`;

  // 导出专业数据
  const majors = await prisma.major.findMany();
  sqlContent += `-- 插入专业数据\n`;
  for (const major of majors) {
    const qualityStats = major.qualityStats
      ? `'${JSON.stringify(major.qualityStats).replace(/'/g, "''")}'`
      : 'NULL';
    const keywords = major.keywords
      ? `'${JSON.stringify(major.keywords).replace(/'/g, "''")}'`
      : 'NULL';
    const lastTrainingAt = major.lastTrainingAt
      ? `'${major.lastTrainingAt.toISOString()}'`
      : 'NULL';

    sqlContent += `INSERT INTO majors (id, name, displayName, category, description, sampleCount, hasModel, lastTrainingAt, qualityStats, keywords, createdAt, updatedAt) VALUES ('${major.id}', '${major.name.replace(/'/g, "''")}', ${major.displayName ? `'${major.displayName.replace(/'/g, "''")}'` : 'NULL'}, ${major.category ? `'${major.category.replace(/'/g, "''")}'` : 'NULL'}, ${major.description ? `'${major.description.replace(/'/g, "''")}'` : 'NULL'}, ${major.sampleCount}, ${major.hasModel ? 1 : 0}, ${lastTrainingAt}, ${qualityStats}, ${keywords}, '${major.createdAt.toISOString()}', '${major.updatedAt.toISOString()}');\n`;
  }

  // 导出关键词统计（前5000条）
  const keywordStats = await prisma.keywordStats.findMany({
    orderBy: { frequency: 'desc' },
    take: 5000,
  });
  sqlContent += `\n-- 插入关键词统计数据\n`;
  for (const keyword of keywordStats) {
    sqlContent += `INSERT INTO keyword_stats (id, keyword, frequency, category, updatedAt) VALUES ('${keyword.id}', '${keyword.keyword.replace(/'/g, "''")}', ${keyword.frequency}, ${keyword.category ? `'${keyword.category.replace(/'/g, "''")}'` : 'NULL'}, '${keyword.updatedAt.toISOString()}');\n`;
  }

  fs.writeFileSync(sqlFile, sqlContent, 'utf8');
  const sizeInMB = (
    Buffer.byteLength(sqlContent, 'utf8') /
    1024 /
    1024
  ).toFixed(2);
  console.log(`   ✓ topicforge-data.sql (${sizeInMB}MB)`);
}

// 执行导出
if (require.main === module) {
  exportDatabase().catch(error => {
    console.error('导出失败:', error);
    process.exit(1);
  });
}

export { exportDatabase };
