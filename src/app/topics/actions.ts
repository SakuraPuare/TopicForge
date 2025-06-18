'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

// 搜索参数验证模式
const searchSchema = z.object({
  search: z.string().optional(),
  major: z.string().optional(),
  year: z.string().optional(),
  page: z.string().optional(),
});

/**
 * 处理搜索表单的 Server Action
 */
export async function searchTopicsAction(formData: FormData): Promise<void> {
  const rawData = {
    search: formData.get('search') as string,
    major: formData.get('major') as string,
    year: formData.get('year') as string,
    page: formData.get('page') as string,
  };

  const validationResult = searchSchema.safeParse(rawData);

  if (!validationResult.success) {
    console.error('搜索参数验证失败:', validationResult.error);
    return;
  }

  const { search, major, year } = validationResult.data;

  // 构建查询参数
  const searchParams = new URLSearchParams();

  if (search && search.trim()) {
    searchParams.set('search', search.trim());
  }

  if (major && major !== 'all') {
    searchParams.set('major', major);
  }

  if (year && year !== 'all') {
    searchParams.set('year', year);
  }

  // 重定向到带有搜索参数的页面
  const queryString = searchParams.toString();
  redirect(queryString ? `/topics?${queryString}` : '/topics');
}

/**
 * 重置搜索的 Server Action
 */
export async function resetSearchAction(): Promise<void> {
  redirect('/topics');
}

/**
 * 页面导航的 Server Action
 */
export async function navigateToPageAction(
  currentSearchParams: URLSearchParams,
  page: number
): Promise<void> {
  const newParams = new URLSearchParams(currentSearchParams);
  newParams.set('page', page.toString());
  redirect(`/topics?${newParams.toString()}`);
}
