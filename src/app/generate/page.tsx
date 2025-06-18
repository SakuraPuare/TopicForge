import { Metadata } from 'next';
import { Suspense } from 'react';
import prisma from '../../lib/db';
import { dataService } from '../../lib/services';
import GenerateClient from './generate-client';
import History from './history';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Zap, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: '生成选题 - TopicForge',
  description: '使用AI技术为您的毕业设计生成创新性选题',
};

async function getMajorsAndYears() {
  const [majors, years] = await Promise.all([
    prisma.graduationTopic.findMany({
      where: {
        major: {
          not: null,
        },
      },
      select: {
        major: true,
      },
      distinct: ['major'],
    }),
    prisma.graduationTopic.findMany({
      where: {
        year: {
          not: null,
        },
      },
      select: {
        year: true,
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc',
      },
    }),
  ]);

  const majorList = majors
    .map(item => item.major)
    .filter((major): major is string => major !== null && major !== '')
    .sort();

  const yearList = years
    .map(item => item.year)
    .filter((year): year is number => year !== null)
    .sort((a, b) => b - a);

  return { majors: majorList, years: yearList };
}

export default async function GeneratePage() {
  // 使用直接的数据库查询方式获取数据，参考 topics/page.tsx 的实现
  const [{ majors, years }, recentSessions] = await Promise.all([
    getMajorsAndYears(),
    dataService.getRecentGenerationSessions(10),
  ]);

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-16 lg:py-20'>
        <div className='absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-purple-50/50 dark:from-zinc-900/50 dark:via-zinc-800/50 dark:to-zinc-900/50' />
        <div className='relative mx-auto max-w-5xl px-6 lg:px-8'>
          <div className='fade-in mb-12 text-center'>
            <Badge variant='secondary' className='mb-4 px-3 py-1'>
              <Zap className='mr-2 h-4 w-4' />
              AI 选题生成器
            </Badge>

            <h1 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
              <span className='gradient-text'>智能生成</span>
              <span className='text-foreground'> 毕业设计选题</span>
            </h1>

            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              只需选择您的专业和偏好，AI将为您生成个性化的毕业设计选题建议
            </p>
          </div>

          <Tabs defaultValue='generate' className='w-full'>
            <TabsList className='mb-8 grid w-full grid-cols-2'>
              <TabsTrigger value='generate' className='flex items-center gap-2'>
                <Sparkles className='h-4 w-4' />
                生成选题
              </TabsTrigger>
              <TabsTrigger value='history' className='flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                历史记录
                {recentSessions.length > 0 && (
                  <Badge variant='secondary' className='ml-1 text-xs'>
                    {recentSessions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='generate' className='mt-0'>
              <Suspense
                fallback={
                  <div className='flex items-center justify-center py-12'>
                    <div className='flex items-center space-x-2'>
                      <Sparkles className='text-primary h-5 w-5 animate-pulse' />
                      <span className='text-muted-foreground'>
                        加载生成器...
                      </span>
                    </div>
                  </div>
                }
              >
                <GenerateClient majors={majors} years={years} />
              </Suspense>
            </TabsContent>

            <TabsContent value='history' className='mt-0'>
              <Suspense
                fallback={
                  <div className='flex items-center justify-center py-12'>
                    <div className='flex items-center space-x-2'>
                      <Clock className='text-primary h-5 w-5 animate-pulse' />
                      <span className='text-muted-foreground'>
                        加载历史记录...
                      </span>
                    </div>
                  </div>
                }
              >
                <History sessions={recentSessions} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
