import nodejieba from 'nodejieba';
import {
  ProcessedTopic,
  QualityAssessment,
  KeywordExtractionConfig,
} from '../interfaces/text-processing';
import {
  STOP_WORDS,
  PUNCTUATION_REGEX,
  NUMBER_REGEX,
} from '../constants/stop-words';
import {
  TECH_DICT,
  MAJOR_SPECIFIC_TECH_DICT,
  BASIC_TECH_TERMS,
} from '../constants/tech-dict';

/**
 * 文本处理器服务类
 */
export class TextProcessorService {
  constructor() {
    this.initializeDictionary();
  }

  /**
   * 初始化词典
   */
  private initializeDictionary(): void {
    // 添加通用技术词典
    TECH_DICT.forEach(word => {
      nodejieba.insertWord(word);
    });

    // 添加专业特定词典
    Object.values(MAJOR_SPECIFIC_TECH_DICT).forEach(words => {
      words.forEach(word => {
        nodejieba.insertWord(word);
      });
    });
  }

  /**
   * 中文分词
   * @param text 待分词的文本
   * @returns 分词结果数组
   */
  tokenize(text: string): string[] {
    const cleanText = this.cleanText(text);
    const tagged = nodejieba.tag(cleanText);

    // 使用提取关键词的方式补充识别专业词组
    const keywords = nodejieba.extract(cleanText, 5);
    const keywordSet = new Set(keywords.map(k => k.word));

    // 合并分词结果和关键词
    const baseTokens = tagged
      .filter(token => this.isValidToken(token.word))
      .map(token => token.word);

    // 把关键词添加到结果中
    const result = new Set([...baseTokens, ...keywordSet]);

    return Array.from(result);
  }

  /**
   * 验证token是否有效
   * @param token 待验证的token
   * @returns 是否有效
   */
  private isValidToken(token: string): boolean {
    return (
      token.length >= 2 &&
      !STOP_WORDS.has(token) &&
      !this.isPunctuation(token) &&
      !this.isNumber(token)
    );
  }

  /**
   * 判断是否为标点符号
   * @param token 待验证的token
   * @returns 是否为标点符号
   */
  private isPunctuation(token: string): boolean {
    return PUNCTUATION_REGEX.test(token);
  }

  /**
   * 判断是否为数字
   * @param token 待验证的token
   * @returns 是否为数字
   */
  private isNumber(token: string): boolean {
    return NUMBER_REGEX.test(token);
  }

  /**
   * 文本清洗
   * @param text 原始文本
   * @returns 清洗后的文本
   */
  cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 移除多余的空白字符
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s，。、：；！？]/g, '') // 保留中文标点，移除其他特殊字符
      .toLowerCase()
      .trim();
  }

  /**
   * 提取关键词
   * @param text 文本内容
   * @param config 提取配置
   * @returns 关键词数组
   */
  extractKeywords(
    text: string,
    config: KeywordExtractionConfig = { topK: 10 }
  ): string[] {
    const tokens = this.tokenize(text);
    const wordFreq = this.calculateWordFrequency(tokens);

    // 如果需要包含技术术语，提升技术词汇权重
    if (config.includeTechTerms) {
      this.boostTechTerms(wordFreq);
    }

    return this.getTopKeywords(wordFreq, config);
  }

  /**
   * 计算词频
   * @param tokens 分词结果
   * @returns 词频映射
   */
  private calculateWordFrequency(tokens: string[]): Map<string, number> {
    const wordFreq = new Map<string, number>();

    tokens.forEach(token => {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
    });

    return wordFreq;
  }

  /**
   * 提升技术术语权重
   * @param wordFreq 词频映射
   */
  private boostTechTerms(wordFreq: Map<string, number>): void {
    for (const [word, freq] of wordFreq.entries()) {
      if (this.isTechTerm(word)) {
        wordFreq.set(word, freq * 1.5); // 提升技术词汇权重
      }
    }
  }

  /**
   * 获取顶部关键词
   * @param wordFreq 词频映射
   * @param config 配置
   * @returns 关键词数组
   */
  private getTopKeywords(
    wordFreq: Map<string, number>,
    config: KeywordExtractionConfig
  ): string[] {
    return Array.from(wordFreq.entries())
      .filter(([, freq]) => !config.minFrequency || freq >= config.minFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, config.topK)
      .map(entry => entry[0]);
  }

  /**
   * 批量处理题目 - 优化版本
   * @param titles 题目数组
   * @param major 专业（可选）
   * @returns 处理结果
   */
  batchProcess(titles: string[], major?: string): ProcessedTopic[] {
    // 优化：预先计算通用数据，减少重复操作
    const batchStartTime = Date.now();

    // 显示进度
    if (titles.length > 1000) {
      console.log(`   开始批处理 ${titles.length.toLocaleString()} 个题目...`);
    }

    const results = titles.map((title, index) => {
      // 显示处理进度
      if (titles.length > 5000 && index > 0 && index % 5000 === 0) {
        const progress = ((index / titles.length) * 100).toFixed(1);
        const speed = Math.round(
          index / ((Date.now() - batchStartTime) / 1000)
        );
        console.log(
          `   处理进度: ${progress}% (${index.toLocaleString()}/${titles.length.toLocaleString()}) - ${speed} 题目/秒`
        );
      }

      return this.processSingleTitle(title, major);
    });

    if (titles.length > 1000) {
      const totalTime = Date.now() - batchStartTime;
      const speed = Math.round(titles.length / (totalTime / 1000));
      console.log(
        `   ✓ 批处理完成，耗时 ${(totalTime / 1000).toFixed(2)} 秒，平均 ${speed} 题目/秒`
      );
    }

    return results;
  }

  /**
   * 高性能批量处理题目 - 专用于训练阶段
   * @param titles 题目数组
   * @param majors 对应的专业数组（可选）
   * @returns 处理结果
   */
  batchProcessForTraining(
    titles: string[],
    majors?: (string | undefined)[]
  ): ProcessedTopic[] {
    const batchStartTime = Date.now();
    console.log(
      `   🚀 开始高性能批处理 ${titles.length.toLocaleString()} 个题目...`
    );

    // 预计算技术词典查找表，提高性能
    const techTermsSet = new Set(TECH_DICT);
    const stopWordsSet = new Set(STOP_WORDS);

    const results: ProcessedTopic[] = [];
    const PROGRESS_STEP = Math.max(1000, Math.floor(titles.length / 20)); // 5%间隔报告进度

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const major = majors?.[i];

      // 显示处理进度
      if (i > 0 && i % PROGRESS_STEP === 0) {
        const progress = ((i / titles.length) * 100).toFixed(1);
        const speed = Math.round(i / ((Date.now() - batchStartTime) / 1000));
        console.log(
          `   处理进度: ${progress}% (${i.toLocaleString()}/${titles.length.toLocaleString()}) - ${speed.toLocaleString()} 题目/秒`
        );
      }

      // 优化的处理流程
      const processedTopic = this.processSingleTitleOptimized(
        title,
        major,
        techTermsSet,
        stopWordsSet
      );
      results.push(processedTopic);
    }

    const totalTime = Date.now() - batchStartTime;
    const speed = Math.round(titles.length / (totalTime / 1000));
    console.log(`   ✅ 高性能批处理完成！`);
    console.log(`   耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
    console.log(`   平均速度: ${speed.toLocaleString()} 题目/秒`);
    console.log(
      `   有效题目: ${results.filter(r => r.quality >= 0.15).length.toLocaleString()}/${results.length.toLocaleString()}`
    );

    return results;
  }

  /**
   * 优化的单个题目处理
   */
  private processSingleTitleOptimized(
    title: string,
    major?: string,
    techTermsSet?: Set<string>,
    stopWordsSet?: Set<string>
  ): ProcessedTopic {
    // 使用预计算的集合提高查找性能
    const tokens = this.tokenizeOptimized(title, stopWordsSet);
    const keywords = this.extractKeywordsOptimized(
      title,
      tokens,
      techTermsSet,
      {
        topK: 5,
        includeTechTerms: true,
      }
    );

    return {
      originalTitle: title,
      cleanTitle: this.cleanText(title),
      tokens,
      keywords,
      tokenCount: tokens.length,
      quality: this.assessQualityOptimized(title, tokens, major, techTermsSet)
        .score,
      major,
    };
  }

  /**
   * 优化的分词方法
   */
  private tokenizeOptimized(
    text: string,
    stopWordsSet?: Set<string>
  ): string[] {
    // 使用预计算的停用词集合
    const stopWords = stopWordsSet || new Set(STOP_WORDS);

    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 清理标点符号
      .split(/\s+/)
      .filter(token => {
        return (
          token.length > 0 &&
          !stopWords.has(token) &&
          !this.isPunctuation(token) &&
          this.isValidToken(token)
        );
      });
  }

  /**
   * 优化的关键词提取
   */
  private extractKeywordsOptimized(
    text: string,
    tokens: string[],
    techTermsSet?: Set<string>,
    config: KeywordExtractionConfig = { topK: 10 }
  ): string[] {
    const wordFreq = new Map<string, number>();

    // 计算词频
    tokens.forEach(token => {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
    });

    // 提升技术术语权重
    if (config.includeTechTerms && techTermsSet) {
      for (const [word, freq] of wordFreq.entries()) {
        if (
          techTermsSet.has(word) ||
          this.isTechTermWithSet(word, techTermsSet)
        ) {
          wordFreq.set(word, freq * 1.5);
        }
      }
    }

    return Array.from(wordFreq.entries())
      .filter(([, freq]) => !config.minFrequency || freq >= config.minFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, config.topK)
      .map(entry => entry[0]);
  }

  /**
   * 优化的质量评估
   */
  private assessQualityOptimized(
    title: string,
    tokens: string[],
    major?: string,
    techTermsSet?: Set<string>
  ): QualityAssessment {
    const factors = {
      length: this.assessLength(title),
      techTerms: this.assessTechTermsOptimized(tokens, major, techTermsSet),
      basicTerms: this.assessBasicTerms(tokens),
      structure: this.assessStructure(tokens),
      uniqueness: this.assessUniqueness(tokens),
    };

    const score = Math.min(
      5.0 *
        (0.3 +
          factors.length * 0.3 +
          factors.techTerms * 0.4 +
          factors.basicTerms * 0.2 +
          factors.structure * 0.1 +
          factors.uniqueness * 0.1),
      5.0
    );

    return { score, factors };
  }

  /**
   * 优化的技术术语评估
   */
  private assessTechTermsOptimized(
    tokens: string[],
    major?: string,
    techTermsSet?: Set<string>
  ): number {
    if (!techTermsSet) {
      return this.assessTechTerms(tokens, major);
    }

    const techWords = tokens.filter(token => {
      const isGeneralTech =
        techTermsSet.has(token) || this.isTechTermWithSet(token, techTermsSet);
      const isMajorSpecific =
        major &&
        MAJOR_SPECIFIC_TECH_DICT[major]?.some(
          techWord => techWord.includes(token) || token.includes(techWord)
        );
      return isGeneralTech || isMajorSpecific;
    });

    return Math.min(techWords.length * 0.25, 1.0);
  }

  /**
   * 使用预计算集合的技术术语判断
   */
  private isTechTermWithSet(word: string, techTermsSet: Set<string>): boolean {
    return (
      techTermsSet.has(word) ||
      Array.from(techTermsSet).some(
        techWord => techWord.includes(word) || word.includes(techWord)
      )
    );
  }

  /**
   * 处理单个题目
   * @param title 题目
   * @param major 专业（可选）
   * @returns 处理结果
   */
  private processSingleTitle(title: string, major?: string): ProcessedTopic {
    const tokens = this.tokenize(title);
    const keywords = this.extractKeywords(title, {
      topK: 5,
      includeTechTerms: true,
    });

    return {
      originalTitle: title,
      cleanTitle: this.cleanText(title),
      tokens,
      keywords,
      tokenCount: tokens.length,
      quality: this.assessQuality(title, tokens, major).score,
      major,
    };
  }

  /**
   * 评估题目质量
   * @param title 原始题目
   * @param tokens 分词结果
   * @param major 专业（可选）
   * @returns 质量评估结果
   */
  assessQuality(
    title: string,
    tokens: string[],
    major?: string
  ): QualityAssessment {
    const factors = {
      length: this.assessLength(title),
      techTerms: this.assessTechTerms(tokens, major),
      basicTerms: this.assessBasicTerms(tokens),
      structure: this.assessStructure(tokens),
      uniqueness: this.assessUniqueness(tokens),
    };

    // 计算加权得分，总分为5分
    const score = Math.min(
      5.0 * // 将1.0的得分转换为5.0
        (0.3 + // 基础分
          factors.length * 0.3 +
          factors.techTerms * 0.4 +
          factors.basicTerms * 0.2 +
          factors.structure * 0.1 +
          factors.uniqueness * 0.1),
      5.0
    );

    return { score, factors };
  }

  /**
   * 评估长度
   * @param title 题目
   * @returns 长度评分
   */
  private assessLength(title: string): number {
    const length = title.length;
    if (length >= 8 && length <= 35) return 1.0;
    if (length >= 6 && length <= 45) return 0.7;
    if (length >= 4) return 0.3;
    return 0;
  }

  /**
   * 评估技术术语
   * @param tokens 分词结果
   * @param major 专业（可选）
   * @returns 技术术语评分
   */
  private assessTechTerms(tokens: string[], major?: string): number {
    const techWords = tokens.filter(token => {
      // 通用技术词汇
      const isGeneralTech = TECH_DICT.some(
        techWord => techWord.includes(token) || token.includes(techWord)
      );

      // 专业特定技术词汇
      const isMajorSpecific =
        major &&
        MAJOR_SPECIFIC_TECH_DICT[major]?.some(
          techWord => techWord.includes(token) || token.includes(techWord)
        );

      return isGeneralTech || isMajorSpecific;
    });

    return Math.min(techWords.length * 0.25, 1.0);
  }

  /**
   * 评估基础术语
   * @param tokens 分词结果
   * @returns 基础术语评分
   */
  private assessBasicTerms(tokens: string[]): number {
    const basicTerms = tokens.filter(token => BASIC_TECH_TERMS.includes(token));
    return Math.min(basicTerms.length * 0.2, 1.0);
  }

  /**
   * 评估结构完整性
   * @param tokens 分词结果
   * @returns 结构评分
   */
  private assessStructure(tokens: string[]): number {
    return tokens.length >= 2 && tokens.length <= 10 ? 1.0 : 0.5;
  }

  /**
   * 评估唯一性
   * @param tokens 分词结果
   * @returns 唯一性评分
   */
  private assessUniqueness(tokens: string[]): number {
    const uniqueTokens = new Set(tokens);
    return uniqueTokens.size >= tokens.length * 0.8 ? 1.0 : 0.5;
  }

  /**
   * 判断是否为技术术语
   * @param word 词汇
   * @returns 是否为技术术语
   */
  private isTechTerm(word: string): boolean {
    return TECH_DICT.some(
      techWord => techWord.includes(word) || word.includes(techWord)
    );
  }
}

// 导出单例实例
export const textProcessor = new TextProcessorService();
