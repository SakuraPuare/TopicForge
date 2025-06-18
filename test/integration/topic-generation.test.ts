/**
 * 主题生成集成测试
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { topicGeneratorService } from '../../src/lib/services/topic-generator.service';
import { prisma } from './setup';

describe('TopicGeneration Integration', () => {
  beforeEach(async () => {
    // 清理测试数据
    await prisma.generatedTopic.deleteMany();
    await prisma.graduationTopic.deleteMany();
  });

  describe('generateTopics', () => {
    test('应该生成马尔科夫链题目', async () => {
      // 插入训练数据
      await prisma.graduationTopic.createMany({
        data: [
          {
            title: '基于深度学习的图像识别系统设计与实现',
            major: '计算机科学与技术',
            processed: true,
          },
          {
            title: '大数据环境下的智能推荐算法研究',
            major: '计算机科学与技术',
            processed: true,
          },
          {
            title: '面向移动端的在线教育平台设计',
            major: '软件工程',
            processed: true,
          },
        ],
      });

      // 先训练模型
      await topicGeneratorService.trainModel('计算机科学与技术', {
        forceRetrain: true,
      });

      const result = await topicGeneratorService.generateTopics({
        count: 3,
        algorithm: 'markov',
        major: '计算机科学与技术',
      });

      // 马尔科夫链生成可能无法达到完全的要求数量，但应该生成一些题目
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.topics.length).toBeLessThanOrEqual(3);
      expect(result.stats.algorithm).toBe('markov');
      expect(result.stats.major).toBe('计算机科学与技术');
      expect(result.stats.validTopics).toBe(result.topics.length);

      // 验证生成的题目质量
      result.topics.forEach(topic => {
        expect(topic).toBeTruthy();
        expect(topic.length).toBeGreaterThan(5);
      });
    });

    test('应该生成模板题目', async () => {
      const result = await topicGeneratorService.generateTopics({
        count: 2,
        algorithm: 'template',
        major: '计算机科学与技术',
      });

      expect(result.topics).toHaveLength(2);
      expect(result.stats.algorithm).toBe('template');
      expect(result.stats.validTopics).toBe(2);
    });

    test('应该使用混合算法生成题目', async () => {
      // 插入训练数据
      await prisma.graduationTopic.createMany({
        data: [
          {
            title: '机器学习算法在金融风险评估中的应用',
            major: '计算机科学与技术',
            processed: true,
          },
          {
            title: '基于区块链的供应链管理系统',
            major: '计算机科学与技术',
            processed: true,
          },
        ],
      });

      // 先训练模型
      await topicGeneratorService.trainModel('计算机科学与技术', {
        forceRetrain: true,
      });

      const result = await topicGeneratorService.generateTopics({
        count: 4,
        algorithm: 'hybrid',
        major: '计算机科学与技术',
      });

      expect(result.topics).toHaveLength(4);
      expect(result.stats.algorithm).toBe('hybrid');
      expect(result.stats.validTopics).toBe(4);
    });

    test('应该处理无数据情况', async () => {
      const result = await topicGeneratorService.generateTopics({
        count: 2,
        algorithm: 'markov',
        major: '不存在的专业',
      });

      // 应该fallback到模板生成
      expect(result.topics.length).toBeGreaterThan(0);
      // 由于马尔科夫生成失败会抛出异常并fallback到模板生成，所以fallbackUsed应该为true
      expect(result.stats.fallbackUsed).toBe(true);
      expect(result.topics.length).toBeLessThanOrEqual(2);
    });

    test('应该记录生成历史', async () => {
      const result = await topicGeneratorService.generateTopics({
        count: 2,
        algorithm: 'template',
        saveToHistory: true,
      });

      expect(result.topics).toHaveLength(2);

      // 验证生成历史已保存 - 使用同一个prisma实例
      const savedTopics = await prisma.generatedTopic.findMany();
      console.log('查询到的生成历史记录数量:', savedTopics.length);
      expect(savedTopics).toHaveLength(2);

      savedTopics.forEach(topic => {
        expect(topic.algorithm).toBe('template');
        expect(topic.content).toBeTruthy();
      });
    });
  });

  describe('getSystemStats', () => {
    test('应该返回系统统计信息', async () => {
      // 插入测试数据 - 使用同一个prisma实例
      await prisma.graduationTopic.createMany({
        data: [
          { title: '测试题目1', processed: true },
          { title: '测试题目2', processed: false },
        ],
      });

      await prisma.generatedTopic.create({
        data: {
          content: '生成的测试题目',
          algorithm: 'markov',
        },
      });

      // 验证数据已插入
      const topicCount = await prisma.graduationTopic.count();
      const generatedCount = await prisma.generatedTopic.count();
      console.log(
        '插入验证 - 题目数量:',
        topicCount,
        '生成记录数量:',
        generatedCount
      );

      const stats = await topicGeneratorService.getSystemStats();

      expect(stats.topicStats.total).toBe(2);
      expect(stats.topicStats.processed).toBe(1);
      expect(stats.topicStats.unprocessed).toBe(1);
      expect(stats.generationStats.totalGenerated).toBe(1);
    });
  });

  describe('trainModel', () => {
    test('应该训练马尔科夫链模型', async () => {
      // 插入训练数据
      await prisma.graduationTopic.createMany({
        data: [
          {
            title: '基于深度学习的医疗图像诊断系统',
            major: '计算机科学与技术',
            processed: true,
          },
          {
            title: '大数据环境下的推荐算法优化研究',
            major: '计算机科学与技术',
            processed: true,
          },
          {
            title: '区块链技术在供应链中的应用',
            major: '计算机科学与技术',
            processed: true,
          },
        ],
      });

      await expect(
        topicGeneratorService.trainModel('计算机科学与技术', {
          forceRetrain: true,
        })
      ).resolves.not.toThrow();

      // 验证模型训练后可以生成题目
      const result = await topicGeneratorService.generateTopics({
        count: 1,
        algorithm: 'markov',
        major: '计算机科学与技术',
      });

      expect(result.topics).toHaveLength(1);
    });

    test('应该处理没有数据的专业', async () => {
      await expect(
        topicGeneratorService.trainModel('不存在的专业', { forceRetrain: true })
      ).rejects.toThrow();
    });
  });

  describe('质量评估集成', () => {
    test('应该正确评估生成题目质量', async () => {
      const result = await topicGeneratorService.generateTopics({
        count: 5,
        algorithm: 'template',
        major: '计算机科学与技术',
        minQuality: 3.0, // 设置最低质量要求
      });

      expect(result.topics).toHaveLength(5);
      expect(result.stats.averageQuality).toBeGreaterThanOrEqual(3.0);

      // 验证每个生成的题目都达到质量要求
      result.topics.forEach(topic => {
        expect(topic.length).toBeGreaterThan(8); // 合理长度
        expect(topic).toMatch(/[\u4e00-\u9fa5]/); // 包含中文字符
      });
    });
  });
});
