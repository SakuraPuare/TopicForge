/**
 * 马尔科夫链配置接口
 */
export interface MarkovConfig {
  order: number; // N-gram 的 N 值，默认为 2
  maxLength: number; // 生成文本的最大长度
  minLength: number; // 生成文本的最小长度
  startTokens: string[]; // 可选的开始词汇
  endTokens: string[]; // 可选的结束词汇
  majorSpecific?: boolean; // 是否使用专业特定的训练数据
}

/**
 * 状态转移接口
 */
export interface StateTransition {
  currentState: string[];
  nextToken: string;
  frequency: number;
  major?: string; // 添加专业标识
}

/**
 * 专业特定的马尔科夫链数据
 */
export interface MajorSpecificChain {
  major: string;
  transitionTable: Map<string, Map<string, number>>;
  sampleCount: number;
  qualityStats: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * 马尔科夫链统计信息接口
 */
export interface MarkovStats {
  stateCount: number;
  totalTransitions: number;
  averageTransitionsPerState: number;
  maxTransitionsPerState: number;
  config: MarkovConfig;
  majorSpecificStats?: Map<
    string,
    {
      stateCount: number;
      sampleCount: number;
    }
  >;
}

/**
 * 生成选项接口
 */
export interface GenerationOptions {
  count: number;
  major?: string;
  preferredStartTokens?: string[];
  preferredEndTokens?: string[];
  qualityThreshold?: number;
}
