/**
 * 文本处理器单元测试
 */

import { textProcessor } from '../../src/lib/services';

describe('TextProcessor', () => {
  describe('tokenize', () => {
    test('应该正确分词', () => {
      const text = '基于深度学习的图像识别系统设计与实现';
      const tokens = textProcessor.tokenize(text);

      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens).toContain('深度学习');
      expect(tokens).toContain('图像识别');
      // 根据jieba分词实际结果调整期望
      expect(tokens).toContain('系统');
    });

    test('应该过滤停用词和短词', () => {
      const text = '基于的的在系统中实现';
      const tokens = textProcessor.tokenize(text);

      // 停用词应该被过滤掉
      expect(tokens).not.toContain('的');
      expect(tokens).not.toContain('在');
      expect(tokens).not.toContain('中');
    });

    test('应该处理空字符串', () => {
      const tokens = textProcessor.tokenize('');
      expect(tokens).toEqual([]);
    });
  });

  describe('cleanText', () => {
    test('应该移除HTML标签', () => {
      const text = '<p>基于深度学习的<b>图像识别</b>系统</p>';
      const cleaned = textProcessor.cleanText(text);

      expect(cleaned).toBe('基于深度学习的图像识别系统');
    });

    test('应该移除特殊字符', () => {
      const text = '基于深度学习的!!!图像识别@@@系统';
      const cleaned = textProcessor.cleanText(text);

      expect(cleaned).toBe('基于深度学习的图像识别系统');
    });

    test('应该统一空白字符', () => {
      const text = '基于   深度学习  的图像识别系统';
      const cleaned = textProcessor.cleanText(text);

      expect(cleaned).toBe('基于 深度学习 的图像识别系统');
    });
  });

  describe('extractKeywords', () => {
    test('应该提取关键词', () => {
      const text = '机器学习算法在智能推荐系统中的应用研究';
      const keywords = textProcessor.extractKeywords(text);

      expect(keywords).toBeInstanceOf(Array);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    test('应该支持自定义配置', () => {
      const text = '深度学习神经网络卷积神经网络循环神经网络机器学习算法';
      const keywords = textProcessor.extractKeywords(text, {
        topK: 3,
        includeTechTerms: true,
      });

      expect(keywords).toHaveLength(3);
    });

    test('应该处理空文本', () => {
      const keywords = textProcessor.extractKeywords('');
      expect(keywords).toEqual([]);
    });
  });

  describe('batchProcess', () => {
    test('应该批量处理多个题目', () => {
      const titles = [
        '基于深度学习的图像识别系统',
        '大数据环境下的智能推荐算法研究',
        '面向移动端的在线教育平台设计',
      ];

      const results = textProcessor.batchProcess(titles);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.originalTitle).toBe(titles[index]);
        expect(result.cleanTitle).toBeTruthy();
        expect(result.tokens).toBeInstanceOf(Array);
        expect(result.keywords).toBeInstanceOf(Array);
        expect(result.tokenCount).toBeGreaterThan(0);
        expect(result.quality).toBeGreaterThanOrEqual(0);
        expect(result.quality).toBeLessThanOrEqual(5);
      });
    });

    test('应该处理空数组', () => {
      const results = textProcessor.batchProcess([]);
      expect(results).toEqual([]);
    });

    test('应该支持专业参数', () => {
      const titles = ['机器学习算法研究'];
      const results = textProcessor.batchProcess(titles, '计算机科学与技术');

      expect(results[0].major).toBe('计算机科学与技术');
    });
  });

  describe('assessQuality', () => {
    test('应该评估题目质量', () => {
      const title = '基于深度学习的医疗图像诊断系统设计与实现';
      const tokens = textProcessor.tokenize(title);
      const assessment = textProcessor.assessQuality(title, tokens);

      expect(assessment.score).toBeGreaterThanOrEqual(0);
      expect(assessment.score).toBeLessThanOrEqual(5);
      expect(assessment.factors).toBeDefined();
      expect(assessment.factors.length).toBeDefined();
      expect(assessment.factors.techTerms).toBeDefined();
      expect(assessment.factors.structure).toBeDefined();
    });

    test('应该给高质量题目更高分数', () => {
      const highQualityTitle = '基于深度学习的医疗图像智能诊断系统设计与实现';
      const lowQualityTitle = '系统';

      const highTokens = textProcessor.tokenize(highQualityTitle);
      const lowTokens = textProcessor.tokenize(lowQualityTitle);

      const highAssessment = textProcessor.assessQuality(
        highQualityTitle,
        highTokens
      );
      const lowAssessment = textProcessor.assessQuality(
        lowQualityTitle,
        lowTokens
      );

      expect(highAssessment.score).toBeGreaterThan(lowAssessment.score);
    });

    test('应该考虑专业相关性', () => {
      const title = '深度学习神经网络算法优化研究';
      const tokens = textProcessor.tokenize(title);

      const csAssessment = textProcessor.assessQuality(
        title,
        tokens,
        '计算机科学与技术'
      );
      const generalAssessment = textProcessor.assessQuality(title, tokens);

      expect(csAssessment.score).toBeGreaterThanOrEqual(
        generalAssessment.score
      );
    });
  });
});
