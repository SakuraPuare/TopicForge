#!/usr/bin/env npx tsx

import { ChaoxingCrawler } from '../src/lib/crawler';

async function main() {
  console.log('🚀 启动无限爬虫模式 - 爬完为止！');
  console.log('='.repeat(50));

  // 创建高性能配置的爬虫实例
  const unlimitedCrawler = new ChaoxingCrawler({
    concurrency: 4, // 高并发数量
    batchSize: 100, // 大批量保存
    delay: 400, // 较短延迟
    retryAttempts: 5, // 更多重试次数
    adaptiveDelay: true, // 启用自适应延迟
    pageSize: 5000, // 每页1000条数据
  });

  console.log('🔧 高性能配置:');
  console.log('- 并发数量: 4');
  console.log('- 批量大小: 100');
  console.log('- 延迟时间: 400ms');
  console.log('- 重试次数: 5');
  console.log('- 自适应延迟: 启用');
  console.log('- 停止条件: 连续3页无数据');
  console.log('='.repeat(50));

  try {
    const startTime = Date.now();

    // 开始无限爬取
    const result = await unlimitedCrawler.crawlUntilComplete();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 无限爬取任务完成！');
    console.log('='.repeat(60));
    console.log(`⏱️  总耗时: ${hours}小时${minutes}分${seconds}秒`);
    console.log(`📄 成功页面: ${result.completedPages} 页`);
    console.log(`📊 总处理数据: ${result.totalProcessed} 条`);
    console.log(`💾 新保存数据: ${result.totalSaved} 条`);
    console.log(`🔄 重复数据: ${result.totalDuplicates} 条`);
    console.log(`❌ 失败页面: ${result.finalFailedPages.length} 页`);
    console.log(`⚠️  错误数量: ${result.errors.length} 个`);

    // 计算性能指标
    const successRate =
      (result.completedPages /
        (result.completedPages + result.finalFailedPages.length)) *
      100;
    const avgTimePerPage = duration / result.completedPages;
    const dataRate = result.totalProcessed / duration;

    console.log('\n📈 性能指标:');
    console.log(`   成功率: ${successRate.toFixed(2)}%`);
    console.log(`   平均每页耗时: ${avgTimePerPage.toFixed(2)} 秒`);
    console.log(`   数据处理速度: ${dataRate.toFixed(2)} 条/秒`);

    // 显示失败页面详情
    if (result.finalFailedPages.length > 0) {
      console.log('\n⚠️  失败页面详情:');
      console.log(`   失败页面: [${result.finalFailedPages.join(', ')}]`);
      console.log('   建议: 可以手动重试这些页面或检查网络连接');
    }

    // 显示错误详情（前5个）
    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情 (前5个):');
      result.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   ... 还有 ${result.errors.length - 5} 个错误`);
      }
    }

    console.log('\n✅ 任务状态: 已完成所有可用数据的爬取');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n💥 无限爬取任务异常:', error);
    console.log('建议检查网络连接或API配置');
    process.exit(1);
  }
}

// 捕获中断信号，优雅退出
process.on('SIGINT', () => {
  console.log('\n\n⏹️  收到中断信号，正在优雅退出...');
  console.log('已处理的数据已保存到数据库');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  收到终止信号，正在优雅退出...');
  process.exit(0);
});

main().catch(error => {
  console.error('启动失败:', error);
  process.exit(1);
});
