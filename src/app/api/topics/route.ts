import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../../../lib/db';

// 查询参数验证模式
const searchParamsSchema = z.object({
  search: z.string().optional(),
  major: z.string().optional(),
  year: z
    .string()
    .transform(val => (val ? parseInt(val) : undefined))
    .optional(),
  page: z.string().transform(val => parseInt(val) || 1),
  pageSize: z.string().transform(val => {
    const size = parseInt(val) || 10;
    return Math.min(Math.max(size, 1), 50); // 限制在1-50之间
  }),
});

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

export async function GET(request: NextRequest) {
  try {
    // 1. 解析查询参数
    const { searchParams } = new URL(request.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      major: searchParams.get('major') || undefined,
      year: searchParams.get('year') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10',
    };

    // 2. 验证参数
    const validationResult = searchParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '查询参数验证失败',
        },
        { status: 400 }
      );
    }

    const { search, major, year, page, pageSize } = validationResult.data;
    const skip = (page - 1) * pageSize;

    // 3. 构建查询条件
    const where: Prisma.GraduationTopicWhereInput = {};

    if (search && search.trim()) {
      where.title = {
        contains: search.trim(),
      };
    }

    if (major && major !== 'all') {
      where.major = major;
    }

    if (year) {
      where.year = year;
    }

    // 4. 获取数据
    const [total, topics] = await Promise.all([
      prisma.graduationTopic.count({ where }),
      prisma.graduationTopic.findMany({
        where,
        skip,
        take: pageSize,
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

    // 5. 构建响应
    const response: TopicsResponse = {
      data: topics,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('搜索选题API失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '搜索选题时发生错误，请稍后重试',
      },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求，支持CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
