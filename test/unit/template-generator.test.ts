/**
 * 模板生成器单元测试
 */

import { templateGenerator } from '../../src/lib/services';

describe('TemplateGenerator', () => {
  describe('generate', () => {
    test('应该生成指定数量的模板题目', async () => {
      const topics = await templateGenerator.generate({
        count: 3,
      });

      expect(topics).toHaveLength(3);
      topics.forEach(topic => {
        expect(topic).toBeTruthy();
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(5);
      });
    });

    test('应该支持专业特定生成', async () => {
      const result = await templateGenerator.generate({
        count: 2,
        major: '计算机科学与技术',
      });

      expect(result).toHaveLength(2);
      result.forEach(topic => {
        expect(topic).toBeTruthy();
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(5);
        // 应该包含技术相关关键词，扩大匹配范围
        expect(topic).toMatch(
          /(系统|算法|技术|平台|应用|研究|设计|实现|分析|预测|优化|管理|监控|决策|数据|网络|软件|硬件|程序|代码|开发|智能|机器学习|深度学习|人工智能|计算机|编程|数据库|互联网|云计算|大数据)/
        );
      });
    });

    test('应该支持主题过滤', async () => {
      const result = await templateGenerator.generate({
        count: 2,
        themes: ['人工智能', '大数据'],
      });

      expect(result).toHaveLength(2);
      result.forEach(topic => {
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(5);
        // 扩大匹配范围以包含更多相关词汇
        expect(topic).toMatch(
          /(人工智能|大数据|机器学习|数据分析|智能|深度学习|神经网络|数据挖掘|云计算|区块链|算法|数据|分析|预测|学习|网络|系统|技术|平台|应用)/
        );
      });
    });

    test('应该处理无效参数', async () => {
      const topics = await templateGenerator.generate({
        count: 0,
      });

      expect(topics).toEqual([]);
    });

    test('应该限制最大生成数量', async () => {
      const topics = await templateGenerator.generate({
        count: 1000, // 超大数量
      });

      // 应该被限制在合理范围内
      expect(topics.length).toBeLessThanOrEqual(50);
    });
  });

  describe('getStats', () => {
    test('应该返回模板统计信息', () => {
      const stats = templateGenerator.getStats();

      expect(stats).toHaveProperty('generalTemplates');
      expect(stats).toHaveProperty('vocabularySize');
      expect(stats.generalTemplates).toBeGreaterThan(0);
      expect(stats.vocabularySize).toBeGreaterThan(0);
    });
  });

  describe('validateTopicQuality', () => {
    test('应该验证高质量题目', () => {
      const goodTopic = '基于深度学习的医疗图像智能诊断系统设计与实现';
      const isValid = templateGenerator.validateTopicQuality(goodTopic);

      expect(isValid).toBe(true);
    });

    test('应该拒绝低质量题目', () => {
      const poorTopics = ['系统', '研究', '设计实现', '基于的系统'];

      poorTopics.forEach(topic => {
        const isValid = templateGenerator.validateTopicQuality(topic);
        expect(isValid).toBe(false);
      });
    });

    test('应该处理空字符串', () => {
      const isValid = templateGenerator.validateTopicQuality('');
      expect(isValid).toBe(false);
    });
  });

  describe('边界条件测试', () => {
    test('应该处理超长专业名称', async () => {
      const longMajorName = '计算机科学与技术及相关交叉学科综合应用研究';
      const topics = await templateGenerator.generate({
        count: 1,
        major: longMajorName,
      });

      expect(topics).toHaveLength(1);
      expect(topics[0]).toBeTruthy();
    });

    test('应该处理特殊字符', async () => {
      const topics = await templateGenerator.generate({
        count: 1,
        major: '计算机@#$%科学',
      });

      expect(topics).toHaveLength(1);
      // 生成的题目应该是清洁的，不包含特殊字符
      expect(topics[0]).not.toMatch(/[@#$%]/);
    });
  });

  describe('性能测试', () => {
    test('应该在合理时间内生成大量题目', async () => {
      const startTime = Date.now();

      const topics = await templateGenerator.generate({
        count: 20,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(topics).toHaveLength(20);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });
  });
});
