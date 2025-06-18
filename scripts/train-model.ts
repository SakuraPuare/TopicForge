#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { TopicGeneratorService } from '../src/lib/services/topic-generator.service';
import { markovChainService } from '../src/lib/services/markov-chain.service';

const prisma = new PrismaClient();
const topicGenerator = new TopicGeneratorService();

async function main() {
  console.log('🚀 开始训练主题生成模型...\n');

  try {
    // 1. 检查数据状态
    console.log('📊 检查数据状态...');
    const totalTopics = await prisma.graduationTopic.count();
    const processedTopics = await prisma.graduationTopic.count({
      where: { processed: true },
    });

    console.log(`   总题目数: ${totalTopics}`);
    console.log(`   已处理题目数: ${processedTopics}`);
    console.log(`   未处理题目数: ${totalTopics - processedTopics}\n`);

    if (totalTopics === 0) {
      console.log('❌ 没有找到题目数据，请先运行爬虫程序');
      return;
    }

    // 2. 获取专业分布
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
    majorStats.forEach((stat, index) => {
      console.log(
        `   ${index + 1}. ${stat.major}: ${stat._count.major} 个题目`
      );
    });
    console.log();

    // 3. 全量训练模型
    console.log('🔧 开始全量训练模型...');
    await topicGenerator.trainModel(undefined, {
      forceRetrain: true,
      qualityThreshold: 0.2, // 降低质量阈值以包含更多数据
    });

    // 4. 检查训练结果
    console.log('\n📋 训练结果统计...');
    const markovStats = markovChainService.getStats();
    console.log(`   马尔科夫链状态数: ${markovStats.stateCount}`);
    console.log(`   总转换次数: ${markovStats.totalTransitions}`);
    console.log(
      `   平均每状态转换数: ${markovStats.averageTransitionsPerState.toFixed(2)}`
    );
    console.log(`   词汇表大小: ${markovStats.vocabulary.length}`);

    // 5. 检查数据库中的马尔科夫链数据
    const dbMarkovCount = await prisma.markovChain.count();
    const dbMajorMarkovCount = await prisma.majorMarkovChain.count();
    console.log(`   数据库通用马尔科夫链: ${dbMarkovCount} 条`);
    console.log(`   数据库专业马尔科夫链: ${dbMajorMarkovCount} 条`);

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

    // 7. 更新处理状态
    console.log('\n💾 更新数据处理状态...');
    await prisma.graduationTopic.updateMany({
      where: { processed: false },
      data: { processed: true },
    });

    console.log('✅ 模型训练完成！');

    // 8. 显示系统统计
    console.log('\n📊 系统统计信息...');
    const systemStats = await topicGenerator.getSystemStats();
    console.log(`   总题目数: ${systemStats.topicStats.total}`);
    console.log(`   已处理题目数: ${systemStats.topicStats.processed}`);
    console.log(`   可用专业数: ${systemStats.majorStats.length}`);
    console.log(`   历史生成数: ${systemStats.generationStats.totalGenerated}`);
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
