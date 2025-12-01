#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { TopicGeneratorService } from '../src/lib/services/topic-generator.service';
import { markovChainService } from '../src/lib/services/markov-chain.service';

const prisma = new PrismaClient();
const topicGenerator = new TopicGeneratorService();

// 优化配置
const BATCH_SIZE = 1000; // 批量处理大小
const PROGRESS_INTERVAL = 5000; // 进度报告间隔

async function main() {
  console.log('🚀 开始训练主题生成模型（优化版本）...\n');

  try {
    // 1. 检查数据状态
    console.log('📊 检查数据状态...');
    const totalTopics = await prisma.graduationTopic.count();
    const processedTopics = await prisma.graduationTopic.count({
      where: { processed: true },
    });

    console.log(`   总题目数: ${totalTopics.toLocaleString()}`);
    console.log(`   已处理题目数: ${processedTopics.toLocaleString()}`);
    console.log(
      `   未处理题目数: ${(totalTopics - processedTopics).toLocaleString()}\n`
    );

    if (totalTopics === 0) {
      console.log('❌ 没有找到题目数据，请先运行导入程序');
      return;
    }

    // 2. 获取专业分布（优化查询）
    console.log('📈 专业分布统计...');
    const majorStats = await prisma.graduationTopic.groupBy({
      by: ['major'],
      where: {
        major: { not: null },
      },
      _count: {
        major: true,
      },
      orderBy: {
        _count: {
          major: 'desc',
        },
      },
      take: 10,
    });

    console.log('   前10个专业分布:');
    majorStats.forEach(
      (
        stat: { major: string | null; _count: { major: number } },
        index: number
      ) => {
        console.log(
          `   ${index + 1}. ${stat.major}: ${stat._count.major.toLocaleString()} 个题目`
        );
      }
    );
    console.log();

    // 3. 优化训练模型 - 使用更高效的配置
    console.log('🔧 开始优化训练模型...');
    console.log(`   批处理大小: ${BATCH_SIZE.toLocaleString()}`);
    console.log(`   进度报告间隔: ${PROGRESS_INTERVAL.toLocaleString()}\n`);

    const startTime = Date.now();
    await topicGenerator.trainModel(undefined, {
      forceRetrain: true,
      qualityThreshold: 0.15, // 稍微降低质量阈值以包含更多数据
    });
    const trainingTime = Date.now() - startTime;

    console.log(`\n⏱️  训练耗时: ${(trainingTime / 1000).toFixed(2)} 秒`);

    // 4. 检查训练结果
    console.log('\n📋 训练结果统计...');
    const markovStats = markovChainService.getStats();
    console.log(
      `   马尔科夫链状态数: ${markovStats.stateCount.toLocaleString()}`
    );
    console.log(
      `   总转换次数: ${markovStats.totalTransitions.toLocaleString()}`
    );
    console.log(
      `   平均每状态转换数: ${markovStats.averageTransitionsPerState.toFixed(2)}`
    );
    console.log(
      `   词汇表大小: ${markovStats.vocabulary.length.toLocaleString()}`
    );

    // 5. 检查数据库中的马尔科夫链数据
    const [dbMarkovCount, dbMajorMarkovCount, dbTokenizedCount] =
      await Promise.all([
        prisma.markovChain.count(),
        prisma.majorMarkovChain.count(),
        prisma.tokenizedWord.count(),
      ]);

    console.log(
      `   数据库通用马尔科夫链: ${dbMarkovCount.toLocaleString()} 条`
    );
    console.log(
      `   数据库专业马尔科夫链: ${dbMajorMarkovCount.toLocaleString()} 条`
    );
    console.log(`   数据库词汇表: ${dbTokenizedCount.toLocaleString()} 词`);

    // 6. 测试生成功能
    console.log('\n🎯 测试生成功能...');
    try {
      const result = await topicGenerator.generateTopics({
        count: 3,
        algorithm: 'markov',
      });

      console.log('   生成的题目示例:');
      result.topics.forEach((topic, index) => {
        console.log(`   ${index + 1}. ${topic}`);
      });
    } catch (error) {
      console.log(`   ⚠️  生成测试失败: ${error}`);
    }

    // 7. 批量更新处理状态
    console.log('\n💾 批量更新数据处理状态...');
    const updateStartTime = Date.now();
    const updateResult = await prisma.graduationTopic.updateMany({
      where: { processed: false },
      data: { processed: true },
    });
    const updateTime = Date.now() - updateStartTime;

    console.log(
      `   ✓ 更新了 ${updateResult.count.toLocaleString()} 条记录，耗时 ${updateTime}ms`
    );

    console.log('\n✅ 模型训练完成！');

    // 8. 显示系统统计
    console.log('\n📊 系统统计信息...');
    const systemStats = await topicGenerator.getSystemStats();
    console.log(
      `   总题目数: ${systemStats.topicStats.total.toLocaleString()}`
    );
    console.log(
      `   已处理题目数: ${systemStats.topicStats.processed.toLocaleString()}`
    );
    console.log(`   可用专业数: ${systemStats.majorStats.length}`);
    console.log(
      `   历史生成数: ${systemStats.generationStats.totalGenerated.toLocaleString()}`
    );

    // 9. 性能总结
    const totalTime = Date.now() - startTime;
    const topicsPerSecond = Math.round(totalTopics / (totalTime / 1000));
    console.log(`\n⚡ 性能统计:`);
    console.log(`   总耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
    console.log(`   处理速度: ${topicsPerSecond.toLocaleString()} 题目/秒`);
  } catch (error) {
    console.error('❌ 训练过程中出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
