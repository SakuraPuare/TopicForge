import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { topicGeneratorService, dataService } from '../../../lib/services';
import type { GenerationParams } from '../../../lib/interfaces/generation';

// 请求体验证模式
const generateRequestSchema = z.object({
  major: z.string().optional(),
  year: z.string().optional(),
  algorithm: z.enum(['markov', 'template', 'hybrid'], {
    errorMap: () => ({ message: '请选择有效的生成算法' }),
  }),
  count: z.number().min(1).max(50, '生成数量必须在1-50之间'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证请求数据
    const validationResult = generateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            validationResult.error.errors[0]?.message || '请求数据验证失败',
        },
        { status: 400 }
      );
    }

    const { major, year, algorithm, count } = validationResult.data;

    // 3. 构建生成参数
    const params: GenerationParams = {
      major: major && major.trim() !== '' ? major.trim() : undefined,
      year: year && year !== 'all' ? year : undefined,
      algorithm,
      count,
      qualityThreshold: 0.15,
      saveToHistory: true,
    };

    // 4. 生成题目
    const result = await topicGeneratorService.generateTopics(params);

    // 5. 验证生成结果
    if (!result || !result.topics || result.topics.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '生成失败：未能生成任何有效题目，请尝试调整参数或重试',
        },
        { status: 500 }
      );
    }

    // 6. 保存生成结果到数据库
    const sessionId = await dataService.saveGenerationSession(result);

    // 7. 返回会话ID
    return NextResponse.json({
      success: true,
      sessionId,
      message: '生成成功',
    });
  } catch (error) {
    console.error('题目生成API失败:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message.includes('生成失败')
              ? error.message
              : `生成失败: ${error.message}`
            : '生成题目时发生未知错误，请稍后重试',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
