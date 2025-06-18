import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import {
  ArrowLeftIcon,
  RefreshCcwIcon,
  StarIcon,
  SparklesIcon,
} from 'lucide-react';
import { GenerationResult } from '../../../../lib/interfaces/generation';
import { dataService } from '../../../../lib/services';
import CopyButton from './copy-button';

export const metadata: Metadata = {
  title: '生成结果 - TopicForge',
  description: '查看生成的毕业设计选题',
};

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

function getQualityColor(quality: number) {
  // 质量分数是5分制，转换判断
  if (quality >= 3.5)
    // 70%以上
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (quality >= 2.5)
    // 50%以上
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
}

function getQualityStars(quality: number) {
  // 质量分数是5分制，转换为5星制
  const stars = Math.round(quality);
  return Array.from({ length: 5 }, (_, i) => (
    <StarIcon
      key={i}
      className={`h-4 w-4 ${
        i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
      }`}
    />
  ));
}

function getQualityPercentage(quality: number) {
  // 质量分数是5分制，转换为百分制
  return Math.round((quality / 5) * 100);
}

function ResultContent({ data }: { data: GenerationResult }) {
  // 计算成功率
  const successRate = data.stats.validTopics / data.stats.totalGenerated;

  return (
    <div className='space-y-6'>
      {/* 返回按钮 */}
      <div className='flex items-center justify-between'>
        <Link href='/generate'>
          <Button variant='outline' className='flex items-center gap-2'>
            <ArrowLeftIcon className='h-4 w-4' />
            返回生成页面
          </Button>
        </Link>
        <Link href='/generate'>
          <Button className='flex items-center gap-2'>
            <RefreshCcwIcon className='h-4 w-4' />
            重新生成
          </Button>
        </Link>
      </div>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>生成统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {(successRate * 100).toFixed(1)}%
              </div>
              <div className='text-muted-foreground text-sm'>成功率</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {getQualityPercentage(data.stats.averageQuality)}%
              </div>
              <div className='text-muted-foreground text-sm'>平均质量</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {data.stats.totalGenerated}
              </div>
              <div className='text-muted-foreground text-sm'>总生成数</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {data.stats.generationTime}ms
              </div>
              <div className='text-muted-foreground text-sm'>生成时间</div>
            </div>
          </div>

          {/* 显示算法和专业信息 */}
          <div className='mt-4 flex flex-wrap gap-2'>
            <Badge variant='outline'>
              算法:{' '}
              {data.algorithm === 'markov'
                ? '马尔科夫链'
                : data.algorithm === 'template'
                  ? '模板生成'
                  : '混合算法'}
            </Badge>
            {data.stats.major && (
              <Badge variant='outline'>专业: {data.stats.major}</Badge>
            )}
            {data.stats.fallbackUsed && (
              <Badge variant='destructive'>使用了备用算法</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 生成结果 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <SparklesIcon className='h-5 w-5' />
            生成结果 ({data.topics.length} 个选题)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {data.topics.map((topic, index) => (
              <div
                key={index}
                className='hover:bg-muted/50 rounded-lg border p-4 transition-colors'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <div className='flex'>
                        {getQualityStars(data.stats.averageQuality)}
                      </div>
                      <Badge
                        variant='outline'
                        className={getQualityColor(data.stats.averageQuality)}
                      >
                        质量: {getQualityPercentage(data.stats.averageQuality)}%
                      </Badge>
                      <Badge variant='secondary'>
                        {data.algorithm === 'markov'
                          ? '马尔科夫'
                          : data.algorithm === 'template'
                            ? '模板'
                            : '混合'}
                      </Badge>
                    </div>
                    <p className='mb-2 text-lg font-medium'>{topic}</p>
                  </div>
                  <CopyButton text={topic} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ResultPage({ params }: PageProps) {
  const { sessionId } = await params;

  // 从数据库获取生成结果
  const data = await dataService.getGenerationSession(sessionId);

  if (!data) {
    notFound();
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-8'>
          <h1 className='mb-4 text-3xl font-bold'>生成结果</h1>
          <p className='text-muted-foreground text-lg'>
            以下是为您生成的毕业设计选题建议
          </p>
        </div>
        <Suspense
          fallback={
            <div className='flex items-center justify-center py-12'>
              <div className='flex items-center space-x-2'>
                <SparklesIcon className='text-primary h-5 w-5 animate-pulse' />
                <span className='text-muted-foreground'>加载中...</span>
              </div>
            </div>
          }
        >
          <ResultContent data={data} />
        </Suspense>
      </div>
    </div>
  );
}
