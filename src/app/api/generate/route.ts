import { NextRequest, NextResponse } from 'next/server';
import { topicGeneratorService } from '../../../lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { major, algorithm, count } = body;

    if (!major) {
      return NextResponse.json({ error: '请指定专业' }, { status: 400 });
    }

    const result = await topicGeneratorService.generateTopics({
      major,
      algorithm: algorithm || 'markov',
      count: count || 5,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('生成题目失败:', error);
    return NextResponse.json(
      { error: '生成题目失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
