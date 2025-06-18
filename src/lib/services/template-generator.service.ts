import { GenerationOptions } from '../interfaces/markov';
import { MAJOR_SPECIFIC_TECH_DICT } from '../constants/tech-dict';

/**
 * 模板生成器服务类
 */
export class TemplateGeneratorService {
  // 通用模板
  private readonly GENERAL_TEMPLATES = [
    '基于{tech}的{domain}{system}',
    '{tech}在{domain}中的{application}',
    '智能{domain}{management}系统',
    '面向{target}的{tech}{platform}',
    '{domain}{data}分析与{optimization}',
    '{tech}驱动的{domain}{solution}',
    '基于{method}的{domain}{analysis}',
    '{tech}在{scenario}中的{implementation}',
    '{domain}中的{tech}{optimization}研究',
    '面向{goal}的{tech}{framework}',
  ];

  // 专业特定模板
  private readonly MAJOR_SPECIFIC_TEMPLATES: Record<string, string[]> = {
    计算机科学与技术: [
      '基于{algorithm}的{problem}{solution}',
      '{dataStructure}在{scenario}中的{application}',
      '{system}{architecture}设计与{implementation}',
      '分布式{system}的{optimization}研究',
      '{protocol}在{network}中的{performance}分析',
    ],
    软件工程: [
      '基于{methodology}的{software}{development}',
      '{pattern}在{project}中的{application}',
      '{tool}驱动的{process}{optimization}',
      '{quality}保障的{software}{testing}',
      '{framework}的{architecture}设计与{implementation}',
    ],
    网络工程: [
      '基于{protocol}的{network}{optimization}',
      '{technology}在{network}中的{application}',
      '{security}机制的{network}{protection}',
      '{monitoring}系统的{network}{management}',
      '{wireless}网络的{performance}{analysis}',
    ],
    信息安全: [
      '基于{crypto}的{data}{protection}',
      '{security}威胁的{detection}与{prevention}',
      '{auth}机制的{system}{security}',
      '{vulnerability}{analysis}与{mitigation}',
      '{privacy}保护的{data}{processing}',
    ],
    数据科学与大数据技术: [
      '基于{ml}的{data}{analysis}',
      '{bigdata}在{domain}中的{application}',
      '{mining}算法的{data}{processing}',
      '{visualization}的{data}{presentation}',
      '{prediction}模型的{performance}{optimization}',
    ],
    人工智能: [
      '基于{dl}的{task}{solution}',
      '{ai}在{domain}中的{application}',
      '{model}的{training}与{optimization}',
      '{nlp}技术的{text}{processing}',
      '{cv}系统的{image}{recognition}',
    ],
  };

  // 词汇库
  private readonly VOCABULARY = {
    // 技术相关
    tech: [
      '大数据',
      '人工智能',
      '机器学习',
      '深度学习',
      '云计算',
      '区块链',
      '物联网',
    ],
    method: [
      '机器学习',
      '深度学习',
      '数据挖掘',
      '统计分析',
      '模式识别',
      '神经网络',
    ],
    algorithm: [
      '遗传算法',
      '粒子群算法',
      '蚁群算法',
      '模拟退火',
      'K-means',
      'SVM',
    ],

    // 领域相关
    domain: [
      '教育',
      '医疗',
      '金融',
      '电商',
      '物流',
      '农业',
      '智能制造',
      '交通',
    ],
    scenario: ['企业环境', '云环境', '移动环境', '边缘计算', '分布式系统'],

    // 系统相关
    system: ['管理系统', '分析平台', '监控系统', '推荐系统', '决策系统'],
    platform: ['服务平台', '分析平台', '管理平台', '开发平台', '监控平台'],
    framework: ['开发框架', '分析框架', '测试框架', '安全框架', '监控框架'],

    // 应用相关
    application: ['应用研究', '优化方法', '算法设计', '系统实现', '性能分析'],
    solution: ['解决方案', '优化策略', '改进方法', '创新方案', '技术方案'],
    implementation: ['设计实现', '系统实现', '算法实现', '优化实现'],

    // 目标相关
    target: ['企业', '用户', '学生', '患者', '客户', '开发者'],
    goal: ['效率提升', '成本降低', '质量改进', '性能优化', '安全保障'],

    // 管理相关
    management: ['信息管理', '数据管理', '流程管理', '资源管理', '风险管理'],
    data: ['数据', '信息', '业务数据', '用户数据', '交易数据'],
    optimization: ['优化', '预测', '决策支持', '智能分析', '自动化'],
    analysis: ['分析方法', '评估体系', '监测机制', '预警系统'],

    // 专业特定词汇
    dataStructure: ['哈希表', '二叉树', '图结构', '堆栈', '队列'],
    protocol: ['TCP/IP', 'HTTP', 'HTTPS', 'WebSocket', 'MQTT'],
    network: ['局域网', '广域网', '无线网络', '移动网络', '卫星网络'],
    security: ['加密', '认证', '授权', '审计', '防护'],
    methodology: ['敏捷开发', '瀑布模型', 'DevOps', '极限编程', 'Scrum'],
    software: ['软件系统', 'Web应用', '移动应用', '桌面应用'],
    development: ['开发方法', '开发流程', '开发工具', '开发环境'],
    pattern: ['设计模式', '架构模式', '行为模式', '创建模式'],
    project: ['软件项目', '开发项目', '测试项目', '维护项目'],
    process: ['开发过程', '测试过程', '部署过程', '维护过程'],
    quality: ['代码质量', '软件质量', '测试质量', '产品质量'],
    testing: ['测试方法', '测试策略', '测试工具', '测试框架'],
    architecture: ['系统架构', '软件架构', '网络架构', '安全架构'],
    technology: ['5G技术', 'WiFi6', '边缘计算', 'SDN', 'NFV'],
    monitoring: ['网络监控', '性能监控', '安全监控', '流量监控'],
    wireless: ['无线', '移动', '蜂窝', '卫星'],
    performance: ['性能', '效率', '吞吐量', '延迟', '可靠性'],
    crypto: ['加密算法', '数字签名', '哈希函数', '密钥管理'],
    detection: ['检测系统', '识别算法', '监测机制', '预警系统'],
    prevention: ['防护策略', '预防机制', '安全措施', '风险控制'],
    auth: ['身份认证', '访问控制', '权限管理', '单点登录'],
    vulnerability: ['漏洞', '安全漏洞', '系统漏洞', '网络漏洞'],
    mitigation: ['缓解策略', '风险控制', '安全加固', '防护措施'],
    privacy: ['隐私', '数据隐私', '用户隐私', '信息隐私'],
    protection: ['保护机制', '安全保护', '数据保护', '隐私保护'],
    processing: ['处理方法', '计算方法', '分析技术', '挖掘技术'],
    ml: ['机器学习', '监督学习', '无监督学习', '强化学习'],
    bigdata: ['大数据', '海量数据', '实时数据', '流式数据'],
    mining: ['数据挖掘', '文本挖掘', '图挖掘', '序列挖掘'],
    visualization: ['数据可视化', '信息可视化', '交互可视化'],
    presentation: ['展示方法', '呈现技术', '可视化技术'],
    prediction: ['预测', '预报', '预警', '预估'],
    dl: ['深度学习', '卷积神经网络', '循环神经网络', '生成对抗网络'],
    task: ['任务', '问题', '挑战', '应用场景'],
    ai: ['人工智能', '智能系统', '认知计算', '知识图谱'],
    model: ['模型', '算法模型', '预测模型', '分类模型'],
    training: ['训练', '学习', '优化', '调参'],
    nlp: ['自然语言处理', '文本分析', '语义理解', '机器翻译'],
    text: ['文本', '语言', '文档', '内容'],
    cv: ['计算机视觉', '图像处理', '模式识别', '目标检测'],
    image: ['图像', '视觉', '图片', '视频'],
    recognition: ['识别', '检测', '分类', '理解'],
  };

  /**
   * 生成基于模板的题目
   * @param options 生成选项
   * @returns 生成的题目数组
   */
  async generate(options: GenerationOptions): Promise<string[]> {
    const results: string[] = [];
    const templates = this.getTemplatesForMajor(options.major);

    console.log(
      `使用模板生成 ${options.count} 个题目${options.major ? `（专业：${options.major}）` : ''}...`
    );

    for (let i = 0; i < options.count; i++) {
      const template = this.selectRandomTemplate(templates);
      const topic = this.fillTemplate(template, options.major);

      if (topic && topic.length >= 6 && topic.length <= 50) {
        results.push(topic);
        console.log(`✓ 模板生成题目 ${i + 1}: ${topic}`);
      } else {
        i--; // 重试
      }
    }

    console.log(`模板生成完成: ${results.length}/${options.count} 个题目`);
    return results;
  }

  /**
   * 获取专业对应的模板
   * @param major 专业名称
   * @returns 模板数组
   */
  private getTemplatesForMajor(major?: string): string[] {
    if (major && this.MAJOR_SPECIFIC_TEMPLATES[major]) {
      // 混合使用专业特定模板和通用模板
      return [
        ...this.MAJOR_SPECIFIC_TEMPLATES[major],
        ...this.GENERAL_TEMPLATES,
      ];
    }
    return this.GENERAL_TEMPLATES;
  }

  /**
   * 随机选择模板
   * @param templates 模板数组
   * @returns 选中的模板
   */
  private selectRandomTemplate(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 填充模板
   * @param template 模板字符串
   * @param major 专业名称
   * @returns 填充后的题目
   */
  private fillTemplate(template: string, major?: string): string {
    let result = template;

    // 获取模板中的占位符
    const placeholders = template.match(/{([^}]+)}/g) || [];

    for (const placeholder of placeholders) {
      const key = placeholder.slice(1, -1); // 去掉大括号
      const value = this.getRandomValue(key, major);
      result = result.replace(placeholder, value);
    }

    return result;
  }

  /**
   * 获取随机值
   * @param key 键名
   * @param major 专业名称
   * @returns 随机值
   */
  private getRandomValue(key: string, major?: string): string {
    // 检查是否有专业特定的词汇
    if (major) {
      const majorSpecificValue = this.getMajorSpecificValue(key, major);
      if (majorSpecificValue) {
        return majorSpecificValue;
      }
    }

    // 使用通用词汇
    const vocabulary = this.VOCABULARY[key as keyof typeof this.VOCABULARY];
    if (vocabulary && vocabulary.length > 0) {
      return vocabulary[Math.floor(Math.random() * vocabulary.length)];
    }

    // 如果没有找到对应的词汇，返回键名本身
    return key;
  }

  /**
   * 获取专业特定的值
   * @param key 键名
   * @param major 专业名称
   * @returns 专业特定的值或null
   */
  private getMajorSpecificValue(key: string, major: string): string | null {
    const majorWords = MAJOR_SPECIFIC_TECH_DICT[major];
    if (!majorWords || majorWords.length === 0) {
      return null;
    }

    // 根据键名和专业匹配特定词汇
    const matchedWords = majorWords.filter(word => {
      switch (key) {
        case 'tech':
        case 'method':
        case 'algorithm':
          return this.isTechRelated(word);
        case 'domain':
        case 'scenario':
          return this.isDomainRelated(word);
        case 'system':
        case 'platform':
        case 'framework':
          return this.isSystemRelated(word);
        default:
          return false;
      }
    });

    if (matchedWords.length > 0) {
      return matchedWords[Math.floor(Math.random() * matchedWords.length)];
    }

    return null;
  }

  /**
   * 判断是否为技术相关词汇
   * @param word 词汇
   * @returns 是否技术相关
   */
  private isTechRelated(word: string): boolean {
    const techKeywords = [
      '算法',
      '技术',
      '方法',
      '学习',
      '智能',
      '计算',
      '网络',
      '系统',
    ];
    return techKeywords.some(keyword => word.includes(keyword));
  }

  /**
   * 判断是否为领域相关词汇
   * @param word 词汇
   * @returns 是否领域相关
   */
  private isDomainRelated(word: string): boolean {
    const domainKeywords = ['管理', '分析', '处理', '应用', '业务', '服务'];
    return domainKeywords.some(keyword => word.includes(keyword));
  }

  /**
   * 判断是否为系统相关词汇
   * @param word 词汇
   * @returns 是否系统相关
   */
  private isSystemRelated(word: string): boolean {
    const systemKeywords = ['系统', '平台', '框架', '工具', '环境', '架构'];
    return systemKeywords.some(keyword => word.includes(keyword));
  }

  /**
   * 获取模板统计信息
   * @returns 统计信息
   */
  getStats(): {
    totalTemplates: number;
    generalTemplates: number;
    majorSpecificTemplates: Record<string, number>;
    vocabularySize: number;
  } {
    const majorSpecificTemplates: Record<string, number> = {};

    for (const [major, templates] of Object.entries(
      this.MAJOR_SPECIFIC_TEMPLATES
    )) {
      majorSpecificTemplates[major] = templates.length;
    }

    return {
      totalTemplates:
        this.GENERAL_TEMPLATES.length +
        Object.values(this.MAJOR_SPECIFIC_TEMPLATES).reduce(
          (sum, templates) => sum + templates.length,
          0
        ),
      generalTemplates: this.GENERAL_TEMPLATES.length,
      majorSpecificTemplates,
      vocabularySize: Object.keys(this.VOCABULARY).length,
    };
  }
}

// 导出单例实例
export const templateGenerator = new TemplateGeneratorService();
