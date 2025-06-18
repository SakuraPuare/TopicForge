// 服务层统一导出文件

// 文本处理服务
export { textProcessor, TextProcessorService } from './text-processor.service';

// 马尔科夫链服务
export { markovChainService, MarkovChainService } from './markov-chain.service';

// 模板生成服务
export {
  templateGenerator,
  TemplateGeneratorService,
} from './template-generator.service';

// 专业管理服务
export { majorService, MajorService } from './major.service';

// 数据获取服务
export { dataService, DataService } from './data.service';

// 主题生成服务（主服务）
export {
  topicGeneratorService,
  TopicGeneratorService,
} from './topic-generator.service';

// 接口导出
export type {
  ProcessedTopic,
  QualityAssessment,
  KeywordExtractionConfig,
} from '../interfaces/text-processing';

export type {
  MarkovConfig,
  StateTransition,
  MajorSpecificChain,
  MarkovStats,
  GenerationOptions,
} from '../interfaces/markov';

export type {
  GenerationParams,
  GenerationResult,
  MajorInfo,
  TrainingConfig,
} from '../interfaces/generation';

// 常量导出
export {
  STOP_WORDS,
  PUNCTUATION_REGEX,
  NUMBER_REGEX,
} from '../constants/stop-words';
export { MAJOR_SPECIFIC_TECH_DICT } from '../constants/tech-dict';
