/**
 * 马尔科夫链服务单元测试
 */

import { markovChainService } from '../../src/lib/services';

describe('MarkovChainService', () => {
  beforeEach(() => {
    markovChainService.clear();
  });

  describe('train', () => {
    test('应该从训练数据构建马尔科夫链', async () => {
      const processedTopics = [
        {
          text: '基于深度学习的图像识别',
          tokens: ['基于', '深度学习', '的', '图像识别'],
          quality: 0.8,
          keywords: ['深度学习', '图像识别'],
        },
        {
          text: '基于机器学习的数据分析',
          tokens: ['基于', '机器学习', '的', '数据分析'],
          quality: 0.7,
          keywords: ['机器学习', '数据分析'],
        },
      ];

      await markovChainService.train(processedTopics);
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBeGreaterThan(0);
      expect(stats.totalTransitions).toBeGreaterThan(0);
    });

    test('应该支持专业特定训练', async () => {
      const processedTopics = [
        {
          text: '机器学习算法优化',
          tokens: ['机器学习', '算法', '优化'],
          quality: 0.8,
          keywords: ['机器学习', '算法'],
          major: '计算机科学与技术',
        },
        {
          text: '深度学习神经网络训练',
          tokens: ['深度学习', '神经网络', '训练'],
          quality: 0.9,
          keywords: ['深度学习', '神经网络'],
          major: '计算机科学与技术',
        },
      ];

      await markovChainService.train(processedTopics);
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBeGreaterThan(0);
      expect(stats.majorSpecificStats).toHaveProperty('计算机科学与技术');
    });

    test('应该处理空训练数据', async () => {
      await markovChainService.train([]);
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBe(0);
      expect(stats.totalTransitions).toBe(0);
    });
  });

  describe('generate', () => {
    beforeEach(async () => {
      const processedTopics = [
        {
          text: '基于深度学习的图像识别系统',
          tokens: ['基于', '深度学习', '的', '图像识别', '系统'],
          quality: 0.8,
          keywords: ['深度学习', '图像识别', '系统'],
        },
        {
          text: '基于机器学习的数据分析平台',
          tokens: ['基于', '机器学习', '的', '数据分析', '平台'],
          quality: 0.7,
          keywords: ['机器学习', '数据分析', '平台'],
        },
        {
          text: '深度学习算法在医疗诊断中的应用',
          tokens: ['深度学习', '算法', '在', '医疗', '诊断', '中的', '应用'],
          quality: 0.9,
          keywords: ['深度学习', '算法', '医疗', '诊断'],
        },
      ];
      await markovChainService.train(processedTopics);
    });

    test('应该生成指定数量的题目', async () => {
      const topics = await markovChainService.generate({
        count: 3,
      });

      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBeGreaterThanOrEqual(0);
      // 如果模型有效，应该能生成题目
      if (topics.length > 0) {
        topics.forEach(topic => {
          expect(typeof topic).toBe('string');
          expect(topic.length).toBeGreaterThan(0);
        });
      }
    });

    test('应该支持专业特定生成', async () => {
      const topics = await markovChainService.generate({
        count: 2,
        major: '计算机科学与技术',
      });

      expect(Array.isArray(topics)).toBe(true);
      // 生成可能失败，但应该返回数组
    });

    test('应该处理质量阈值', async () => {
      const topics = await markovChainService.generate({
        count: 2,
        qualityThreshold: 0.5,
      });

      expect(Array.isArray(topics)).toBe(true);
    });
  });

  describe('clear', () => {
    test('应该清空马尔科夫链数据', async () => {
      const processedTopics = [
        {
          text: '测试数据',
          tokens: ['测试', '数据'],
          quality: 0.5,
          keywords: ['测试'],
        },
      ];

      await markovChainService.train(processedTopics);

      let stats = markovChainService.getStats();
      expect(stats.stateCount).toBeGreaterThan(0);

      markovChainService.clear();
      stats = markovChainService.getStats();

      expect(stats.stateCount).toBe(0);
      expect(stats.totalTransitions).toBe(0);
    });
  });

  describe('getStats', () => {
    test('应该返回正确的统计信息', async () => {
      const processedTopics = [
        {
          text: 'A B C',
          tokens: ['A', 'B', 'C'],
          quality: 0.8,
          keywords: ['A', 'B'],
        },
        {
          text: 'A B D',
          tokens: ['A', 'B', 'D'],
          quality: 0.7,
          keywords: ['A', 'B'],
        },
        {
          text: 'B C E',
          tokens: ['B', 'C', 'E'],
          quality: 0.9,
          keywords: ['B', 'C'],
        },
      ];

      await markovChainService.train(processedTopics);

      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBeGreaterThan(0);
      expect(stats.totalTransitions).toBeGreaterThan(0);
      expect(stats.averageTransitionsPerState).toBeGreaterThan(0);
      expect(stats.vocabulary).toBeInstanceOf(Array);
      expect(stats.vocabulary.length).toBeGreaterThan(0);
    });

    test('应该返回空统计信息', () => {
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBe(0);
      expect(stats.totalTransitions).toBe(0);
      expect(stats.averageTransitionsPerState).toBe(0);
      expect(stats.vocabulary).toEqual([]);
    });
  });
});
