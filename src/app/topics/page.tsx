import { Metadata } from 'next';
import { Suspense } from 'react';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/db';
import TopicsClient from './topics-client';
import { Badge } from '@/components/ui/badge';
import { Database, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: '选题库 - TopicForge',
  description: '浏览和搜索毕业设计选题数据库',
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    major?: string;
    year?: string;
    page?: string;
    pageSize?: string;
  }>;
}

interface Topic {
  id: string;
  title: string;
  school?: string | null;
  major?: string | null;
  year?: number | null;
  keywords?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TopicsResponse {
  data: Topic[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

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

async function getTopics(
  searchParams: Awaited<PageProps['searchParams']>
): Promise<TopicsResponse> {
  const {
    search = '',
    major = '',
    year,
    page = '1',
    pageSize = '10',
  } = searchParams;

  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(pageSize);
  const skip = (currentPage - 1) * itemsPerPage;

  // 构建查询条件
  const where: Prisma.GraduationTopicWhereInput = {};

  if (search) {
    where.title = {
      contains: search,
    };
  }

  if (major) {
    where.major = major;
  }

  if (year) {
    where.year = parseInt(year);
  }

  // 获取总数和数据
  const [total, topics] = await Promise.all([
    prisma.graduationTopic.count({ where }),
    prisma.graduationTopic.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        school: true,
        major: true,
        year: true,
        keywords: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    data: topics,
    pagination: {
      page: currentPage,
      pageSize: itemsPerPage,
      total,
      totalPages: Math.ceil(total / itemsPerPage),
    },
  };
}

export default async function TopicsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const [topicsData, { majors, years }] = await Promise.all([
    getTopics(resolvedSearchParams),
    getMajorsAndYears(),
  ]);

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-16 lg:py-20'>
        <div className='absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-purple-50/50 dark:from-zinc-900/50 dark:via-zinc-800/50 dark:to-zinc-900/50' />
        <div className='relative mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='fade-in mb-12 text-center'>
            <Badge variant='secondary' className='mb-4 px-3 py-1'>
              <Database className='mr-2 h-4 w-4' />
              选题数据库
            </Badge>

            <h1 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
              <span className='gradient-text'>海量选题</span>
              <span className='text-foreground'> 等你发现</span>
            </h1>

            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              浏览历届优秀毕业设计选题，发现创新灵感，为您的学术研究提供参考
            </p>
          </div>

          <Suspense
            fallback={
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center space-x-2'>
                  <Search className='text-primary h-5 w-5 animate-pulse' />
                  <span className='text-muted-foreground'>加载选题库...</span>
                </div>
              </div>
            }
          >
            <TopicsClient
              initialData={topicsData}
              majors={majors}
              years={years}
              initialSearchParams={resolvedSearchParams}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
