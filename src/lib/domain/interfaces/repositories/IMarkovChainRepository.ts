/**
 * Markov Chain Repository Interface
 */

import { Result } from '../../../core/types/result';
import { DatabaseError } from '../../../core/types/errors';

export interface MarkovChainDTO {
  id: string;
  currentWord: string;
  nextWord: string;
  frequency: number;
}

export interface MajorMarkovChainDTO extends MarkovChainDTO {
  major: string;
}

export interface ChainData {
  currentWord: string;
  nextWord: string;
  frequency: number;
}

export interface MajorChainData extends ChainData {
  major: string;
}

export interface IMarkovChainRepository {
  /**
   * 获取所有通用马尔科夫链
   */
  findAll(): Promise<Result<MarkovChainDTO[], DatabaseError>>;

  /**
   * 根据专业获取马尔科夫链
   */
  findByMajor(
    major: string
  ): Promise<Result<MajorMarkovChainDTO[], DatabaseError>>;

  /**
   * 获取所有专业马尔科夫链
   */
  findAllMajorChains(): Promise<Result<MajorMarkovChainDTO[], DatabaseError>>;

  /**
   * 保存通用马尔科夫链
   */
  saveGeneralChains(chains: ChainData[]): Promise<Result<void, DatabaseError>>;

  /**
   * 保存专业马尔科夫链
   */
  saveMajorChains(
    chains: MajorChainData[]
  ): Promise<Result<void, DatabaseError>>;

  /**
   * 更新或插入通用链
   */
  upsertGeneralChain(chain: ChainData): Promise<Result<void, DatabaseError>>;

  /**
   * 更新或插入专业链
   */
  upsertMajorChain(chain: MajorChainData): Promise<Result<void, DatabaseError>>;

  /**
   * 清除所有通用链
   */
  clearGeneralChains(): Promise<Result<void, DatabaseError>>;

  /**
   * 清除指定专业的链
   */
  clearMajorChains(major?: string): Promise<Result<void, DatabaseError>>;

  /**
   * 获取链数量统计
   */
  getStats(): Promise<
    Result<{ generalCount: number; majorCount: number }, DatabaseError>
  >;
}
