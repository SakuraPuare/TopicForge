/**
 * Dependency Injection Tokens
 * 用于 tsyringe 容器的注入令牌
 */

export const TOKENS = {
  // Database
  PrismaClient: Symbol.for('PrismaClient'),

  // Repositories
  GraduationTopicRepository: Symbol.for('GraduationTopicRepository'),
  GeneratedTopicRepository: Symbol.for('GeneratedTopicRepository'),
  GenerationSessionRepository: Symbol.for('GenerationSessionRepository'),
  MajorRepository: Symbol.for('MajorRepository'),
  MarkovChainRepository: Symbol.for('MarkovChainRepository'),
  MajorMarkovChainRepository: Symbol.for('MajorMarkovChainRepository'),
  KeywordStatsRepository: Symbol.for('KeywordStatsRepository'),
  TokenizedWordRepository: Symbol.for('TokenizedWordRepository'),

  // Services
  TextProcessorService: Symbol.for('TextProcessorService'),
  MarkovChainService: Symbol.for('MarkovChainService'),
  TemplateGeneratorService: Symbol.for('TemplateGeneratorService'),
  MajorService: Symbol.for('MajorService'),
  TopicGeneratorService: Symbol.for('TopicGeneratorService'),
  DataService: Symbol.for('DataService'),
} as const;

export type TokenKey = keyof typeof TOKENS;
