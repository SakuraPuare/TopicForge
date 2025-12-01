/**
 * Markov Chain Repository Implementation
 */

import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../core/tokens';
import { Result } from '../../core/types/result';
import { DatabaseError } from '../../core/types/errors';
import {
  IMarkovChainRepository,
  MarkovChainDTO,
  MajorMarkovChainDTO,
  ChainData,
  MajorChainData,
} from '../../domain/interfaces/repositories/IMarkovChainRepository';
import { BaseRepository } from './base/BaseRepository';
import { DatabaseClient } from '../database/prisma-client';

@injectable()
export class MarkovChainRepository
  extends BaseRepository
  implements IMarkovChainRepository
{
  constructor(@inject(TOKENS.PrismaClient) databaseClient: DatabaseClient) {
    super(databaseClient);
  }

  async findAll(): Promise<Result<MarkovChainDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.markovChain.findMany();
      return records.map(r => ({
        id: r.id,
        currentWord: r.currentWord,
        nextWord: r.nextWord,
        frequency: r.frequency,
      }));
    }, 'findAll');
  }

  async findByMajor(
    major: string
  ): Promise<Result<MajorMarkovChainDTO[], DatabaseError>> {
    return this.executeQuery(async () => {
      const records = await this.prisma.majorMarkovChain.findMany({
        where: { major },
      });
      return records.map(r => ({
        id: r.id,
        major: r.major,
        currentWord: r.currentWord,
        nextWord: r.nextWord,
        frequency: r.frequency,
      }));
    }, 'findByMajor');
  }

  async findAllMajorChains(): Promise<
    Result<MajorMarkovChainDTO[], DatabaseError>
  > {
    return this.executeQuery(async () => {
      const records = await this.prisma.majorMarkovChain.findMany();
      return records.map(r => ({
        id: r.id,
        major: r.major,
        currentWord: r.currentWord,
        nextWord: r.nextWord,
        frequency: r.frequency,
      }));
    }, 'findAllMajorChains');
  }

  async saveGeneralChains(
    chains: ChainData[]
  ): Promise<Result<void, DatabaseError>> {
    const batchSize = 1000;
    return this.executeBatch(
      chains,
      batchSize,
      async batch => {
        for (const chain of batch) {
          await this.prisma.markovChain.upsert({
            where: {
              currentWord_nextWord: {
                currentWord: chain.currentWord,
                nextWord: chain.nextWord,
              },
            },
            update: { frequency: chain.frequency },
            create: {
              currentWord: chain.currentWord,
              nextWord: chain.nextWord,
              frequency: chain.frequency,
            },
          });
        }
      },
      'saveGeneralChains'
    );
  }

  async saveMajorChains(
    chains: MajorChainData[]
  ): Promise<Result<void, DatabaseError>> {
    const batchSize = 1000;
    return this.executeBatch(
      chains,
      batchSize,
      async batch => {
        for (const chain of batch) {
          await this.prisma.majorMarkovChain.upsert({
            where: {
              major_currentWord_nextWord: {
                major: chain.major,
                currentWord: chain.currentWord,
                nextWord: chain.nextWord,
              },
            },
            update: { frequency: chain.frequency },
            create: {
              major: chain.major,
              currentWord: chain.currentWord,
              nextWord: chain.nextWord,
              frequency: chain.frequency,
            },
          });
        }
      },
      'saveMajorChains'
    );
  }

  async upsertGeneralChain(
    chain: ChainData
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.markovChain.upsert({
        where: {
          currentWord_nextWord: {
            currentWord: chain.currentWord,
            nextWord: chain.nextWord,
          },
        },
        update: { frequency: chain.frequency },
        create: {
          currentWord: chain.currentWord,
          nextWord: chain.nextWord,
          frequency: chain.frequency,
        },
      });
    }, 'upsertGeneralChain');
  }

  async upsertMajorChain(
    chain: MajorChainData
  ): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.majorMarkovChain.upsert({
        where: {
          major_currentWord_nextWord: {
            major: chain.major,
            currentWord: chain.currentWord,
            nextWord: chain.nextWord,
          },
        },
        update: { frequency: chain.frequency },
        create: {
          major: chain.major,
          currentWord: chain.currentWord,
          nextWord: chain.nextWord,
          frequency: chain.frequency,
        },
      });
    }, 'upsertMajorChain');
  }

  async clearGeneralChains(): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      await this.prisma.markovChain.deleteMany();
    }, 'clearGeneralChains');
  }

  async clearMajorChains(major?: string): Promise<Result<void, DatabaseError>> {
    return this.executeQuery(async () => {
      if (major) {
        await this.prisma.majorMarkovChain.deleteMany({
          where: { major },
        });
      } else {
        await this.prisma.majorMarkovChain.deleteMany();
      }
    }, 'clearMajorChains');
  }

  async getStats(): Promise<
    Result<{ generalCount: number; majorCount: number }, DatabaseError>
  > {
    return this.executeQuery(async () => {
      const [generalCount, majorCount] = await Promise.all([
        this.prisma.markovChain.count(),
        this.prisma.majorMarkovChain.count(),
      ]);
      return { generalCount, majorCount };
    }, 'getStats');
  }
}
