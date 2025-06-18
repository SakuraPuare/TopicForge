import { NextResponse } from 'next/server';
import { topicGeneratorService } from '../../../lib/services';

export async function GET() {
  try {
    const majors = await topicGeneratorService.getAvailableMajors();
    return NextResponse.json(majors);
  } catch (error) {
    console.error('获取专业列表失败:', error);
    return NextResponse.json({ error: '获取专业列表失败' }, { status: 500 });
  }
}
