/**
 * Dependency Injection Container
 * 使用 tsyringe 管理所有依赖
 */

import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { TOKENS } from './tokens';

// Database
import { DatabaseClient } from '../infrastructure/database/prisma-client';

// Repositories
import { GraduationTopicRepository } from '../infrastructure/repositories/GraduationTopicRepository';
import { GenerationSessionRepository } from '../infrastructure/repositories/GenerationSessionRepository';
import { MarkovChainRepository } from '../infrastructure/repositories/MarkovChainRepository';
import { MajorRepository } from '../infrastructure/repositories/MajorRepository';
import { KeywordStatsRepository } from '../infrastructure/repositories/KeywordStatsRepository';
import { GeneratedTopicRepository } from '../infrastructure/repositories/GeneratedTopicRepository';
import { TokenizedWordRepository } from '../infrastructure/repositories/TokenizedWordRepository';

// Repository Interfaces
import type { IGraduationTopicRepository } from '../domain/interfaces/repositories/IGraduationTopicRepository';
import type { IGenerationSessionRepository } from '../domain/interfaces/repositories/IGenerationSessionRepository';
import type { IMarkovChainRepository } from '../domain/interfaces/repositories/IMarkovChainRepository';
import type { IMajorRepository } from '../domain/interfaces/repositories/IMajorRepository';
import type { IKeywordStatsRepository } from '../domain/interfaces/repositories/IKeywordStatsRepository';
import type { IGeneratedTopicRepository } from '../domain/interfaces/repositories/IGeneratedTopicRepository';
import type { ITokenizedWordRepository } from '../domain/interfaces/repositories/ITokenizedWordRepository';

/**
 * 注册所有依赖
 */
function registerDependencies(c: DependencyContainer): void {
  // 注册数据库客户端（单例）
  c.registerSingleton(TOKENS.PrismaClient, DatabaseClient);

  // 注册 Repositories
  c.register(TOKENS.GraduationTopicRepository, {
    useClass: GraduationTopicRepository,
  });
  c.register(TOKENS.GenerationSessionRepository, {
    useClass: GenerationSessionRepository,
  });
  c.register(TOKENS.MarkovChainRepository, { useClass: MarkovChainRepository });
  c.register(TOKENS.MajorRepository, { useClass: MajorRepository });
  c.register(TOKENS.KeywordStatsRepository, {
    useClass: KeywordStatsRepository,
  });
  c.register(TOKENS.GeneratedTopicRepository, {
    useClass: GeneratedTopicRepository,
  });
  c.register(TOKENS.TokenizedWordRepository, {
    useClass: TokenizedWordRepository,
  });
}

// 注册依赖
registerDependencies(container);

/**
 * 导出容器
 */
export { container };

/**
 * 获取服务实例的便捷方法
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * 获取数据库客户端
 */
export function getDatabaseClient(): DatabaseClient {
  return container.resolve<DatabaseClient>(TOKENS.PrismaClient);
}

/**
 * 获取 Graduation Topic Repository
 */
export function getGraduationTopicRepository(): IGraduationTopicRepository {
  return container.resolve<IGraduationTopicRepository>(
    TOKENS.GraduationTopicRepository
  );
}

/**
 * 获取 Generation Session Repository
 */
export function getGenerationSessionRepository(): IGenerationSessionRepository {
  return container.resolve<IGenerationSessionRepository>(
    TOKENS.GenerationSessionRepository
  );
}

/**
 * 获取 Markov Chain Repository
 */
export function getMarkovChainRepository(): IMarkovChainRepository {
  return container.resolve<IMarkovChainRepository>(
    TOKENS.MarkovChainRepository
  );
}

/**
 * 获取 Major Repository
 */
export function getMajorRepository(): IMajorRepository {
  return container.resolve<IMajorRepository>(TOKENS.MajorRepository);
}

/**
 * 获取 Keyword Stats Repository
 */
export function getKeywordStatsRepository(): IKeywordStatsRepository {
  return container.resolve<IKeywordStatsRepository>(
    TOKENS.KeywordStatsRepository
  );
}

/**
 * 获取 Generated Topic Repository
 */
export function getGeneratedTopicRepository(): IGeneratedTopicRepository {
  return container.resolve<IGeneratedTopicRepository>(
    TOKENS.GeneratedTopicRepository
  );
}

/**
 * 获取 Tokenized Word Repository
 */
export function getTokenizedWordRepository(): ITokenizedWordRepository {
  return container.resolve<ITokenizedWordRepository>(
    TOKENS.TokenizedWordRepository
  );
}

/**
 * 创建子容器（用于测试）
 */
export function createChildContainer(): DependencyContainer {
  return container.createChildContainer();
}

/**
 * 重置容器（用于测试）
 */
export function resetContainer(): void {
  container.clearInstances();
}
