/**
 * 马尔科夫链服务单元测试
 */

import { markovChainService } from '../../src/lib/services';

describe('MarkovChainService', () => {
  beforeEach(() => {
    markovChainService.clear();
  });

  describe('train', () => {
    test('应该从训练数据构建马尔科夫链', () => {
      const trainingData = [
        ['基于', '深度学习', '的', '图像识别'],
        ['基于', '机器学习', '的', '数据分析'],
        ['深度学习', '算法', '研究'],
      ];

      markovChainService.train(trainingData);
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBeGreaterThan(0);
      expect(stats.totalTransitions).toBeGreaterThan(0);
    });

    test('应该支持专业特定训练', () => {
      const trainingData = [
        ['机器学习', '算法', '优化'],
        ['深度学习', '神经网络', '训练'],
      ];

      markovChainService.train(trainingData, '计算机科学与技术');
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBeGreaterThan(0);
    });

    test('应该处理空训练数据', () => {
      markovChainService.train([]);
      const stats = markovChainService.getStats();

      expect(stats.stateCount).toBe(0);
      expect(stats.totalTransitions).toBe(0);
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      const trainingData = [
        ['基于', '深度学习', '的', '图像识别', '系统'],
        ['基于', '机器学习', '的', '数据分析', '平台'],
        ['深度学习', '算法', '在', '医疗', '诊断', '中的', '应用'],
        ['人工智能', '技术', '在', '自动驾驶', '系统', '中的', '应用'],
      ];
      markovChainService.train(trainingData);
    });

    test('应该生成指定长度的序列', () => {
      const sequence = markovChainService.generate({
        length: 5,
        startWord: '基于',
      });

      expect(sequence).toHaveLength(5);
      expect(sequence[0]).toBe('基于');
    });

    test('应该支持随机起始词', () => {
      const sequence = markovChainService.generate({
        length: 3,
      });

      expect(sequence).toHaveLength(3);
      expect(sequence[0]).toBeTruthy();
    });

    test('应该支持多样性控制', () => {
      const conservativeSequence = markovChainService.generate({
        length: 5,
        startWord: '基于',
        temperature: 0.1, // 低温度，更保守
      });

      const creativeSequence = markovChainService.generate({
        length: 5,
        startWord: '基于',
        temperature: 2.0, // 高温度，更有创意
      });

      expect(conservativeSequence).toHaveLength(5);
      expect(creativeSequence).toHaveLength(5);
    });

    test('应该处理无效起始词', () => {
      const sequence = markovChainService.generate({
        length: 3,
        startWord: '不存在的词',
      });

      // 应该fallback到随机起始词
      expect(sequence.length).toBeGreaterThan(0);
    });

    test('应该支持专业特定生成', () => {
      const sequence = markovChainService.generate({
        length: 4,
        major: '计算机科学与技术',
      });

      expect(sequence).toHaveLength(4);
    });
  });

  describe('getNextWord', () => {
    beforeEach(() => {
      const trainingData = [
        ['机器', '学习'],
        ['机器', '学习'],
        ['机器', '视觉'],
      ];
      markovChainService.train(trainingData);
    });

    test('应该根据概率分布选择下一个词', () => {
      const nextWord = markovChainService.getNextWord('机器');
      expect(['学习', '视觉']).toContain(nextWord);
    });

    test('应该处理未知词', () => {
      const nextWord = markovChainService.getNextWord('未知词');
      expect(nextWord).toBeNull();
    });
  });

  describe('clear', () => {
    test('应该清空马尔科夫链数据', () => {
      const trainingData = [['测试', '数据']];
      markovChainService.train(trainingData);

      let stats = markovChainService.getStats();
      expect(stats.stateCount).toBeGreaterThan(0);

      markovChainService.clear();
      stats = markovChainService.getStats();

      expect(stats.stateCount).toBe(0);
      expect(stats.totalTransitions).toBe(0);
    });
  });

  describe('getStats', () => {
    test('应该返回正确的统计信息', () => {
      const trainingData = [
        ['A', 'B', 'C'],
        ['A', 'B', 'D'],
        ['B', 'C', 'E'],
      ];
      markovChainService.train(trainingData);

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
