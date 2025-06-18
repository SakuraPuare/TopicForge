'use server';

import { redirect, RedirectType } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { topicGeneratorService, dataService } from '../../lib/services';
import type { GenerationParams } from '../../lib/interfaces/generation';

// 定义表单验证模式
const generateFormSchema = z.object({
  major: z.string().min(1, '请选择专业'),
  year: z.string().optional(),
  algorithm: z.enum(['markov', 'template', 'hybrid'], {
    errorMap: () => ({ message: '请选择有效的生成算法' }),
  }),
  count: z.string().transform((val, ctx) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '生成数量必须在1-50之间',
      });
      return z.NEVER;
    }
    return num;
  }),
});

// 定义操作结果类型
type ActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

/**
 * 生成题目的 Server Action
 */
export async function generateTopicsAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    // 1. 解析和验证表单数据
    const rawData = {
      major: formData.get('major') as string,
      year: formData.get('year') as string,
      algorithm: formData.get('algorithm') as string,
      count: formData.get('count') as string,
    };

    const validationResult = generateFormSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.errors[0]?.message || '表单数据验证失败';
      return {
        success: false,
        error: errorMessage,
      };
    }

    const { major, year, algorithm, count } = validationResult.data;

    // 2. 构建生成参数
    const params: GenerationParams = {
      major: major.trim(),
      year: year && year !== 'all' ? year : undefined,
      algorithm,
      count,
      qualityThreshold: 0.15,
      saveToHistory: true,
    };

    // 3. 生成题目
    const result = await topicGeneratorService.generateTopics(params);

    // 4. 验证生成结果
    if (!result || !result.topics || result.topics.length === 0) {
      return {
        success: false,
        error: '生成失败：未能生成任何有效题目，请尝试调整参数或重试',
      };
    }

    // 5. 保存生成结果到数据库
    const sessionId = await dataService.saveGenerationSession(result);

    // 6. 清除相关页面缓存
    revalidatePath('/generate');
    revalidatePath('/topics');

    // 7. 重定向到结果页面
    redirect(`/generate/result/${sessionId}`, RedirectType.push);
  } catch (error) {
    console.error('题目生成失败:', error);

    // 如果是重定向错误，直接抛出（这是正常行为）
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message.includes('生成失败')
            ? error.message
            : `生成失败: ${error.message}`
          : '生成题目时发生未知错误，请稍后重试',
    };
  }
}

/**
 * 重置表单的 Server Action
 */
export async function resetFormAction(): Promise<void> {
  redirect('/generate', RedirectType.replace);
}
