'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Clock, Eye, Zap, Settings, Sparkles } from 'lucide-react';
import type {
  GenerationParams,
  GenerationResult,
} from '../../lib/interfaces/generation';

interface HistorySession {
  id: string;
  algorithm: string;
  params: GenerationParams;
  stats: GenerationResult['stats'];
  createdAt: Date;
  topicCount: number;
}

interface HistoryProps {
  sessions: HistorySession[];
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getAlgorithmInfo(algorithm: string) {
  const algorithmMap = {
    markov: {
      label: '马尔科夫链',
      icon: Zap,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    template: {
      label: '模板生成',
      icon: Settings,
      color:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    hybrid: {
      label: '混合算法',
      icon: Sparkles,
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    },
  };
  return (
    algorithmMap[algorithm as keyof typeof algorithmMap] || algorithmMap.markov
  );
}

function getQualityPercentage(quality: number): number {
  // 质量分数是5分制，转换为百分制
  return Math.round((quality / 5) * 100);
}

export default function History({ sessions }: HistoryProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            生成历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground py-8 text-center'>
            <Clock className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p>暂无生成历史</p>
            <p className='text-sm'>开始生成您的第一个选题吧！</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          生成历史 ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {sessions.map(session => {
            const algorithmInfo = getAlgorithmInfo(session.algorithm);
            const AlgorithmIcon = algorithmInfo.icon;

            return (
              <div
                key={session.id}
                className='hover:bg-muted/50 rounded-lg border p-4 transition-colors'
              >
                <div className='flex items-center justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Badge variant='outline' className={algorithmInfo.color}>
                        <AlgorithmIcon className='mr-1 h-3 w-3' />
                        {algorithmInfo.label}
                      </Badge>
                      <Badge variant='secondary'>
                        {session.topicCount} 个选题
                      </Badge>
                      {session.params.major && (
                        <Badge variant='outline'>{session.params.major}</Badge>
                      )}
                    </div>

                    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        {formatDate(session.createdAt)}
                      </span>
                      <span>
                        质量:{' '}
                        {getQualityPercentage(session.stats.averageQuality)}%
                      </span>
                      <span>
                        成功率:{' '}
                        {Math.round(
                          (session.stats.validTopics /
                            session.stats.totalGenerated) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <Link href={`/generate/result/${session.id}`}>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex items-center gap-2'
                    >
                      <Eye className='h-4 w-4' />
                      查看结果
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
