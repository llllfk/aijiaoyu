import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const subject = searchParams.get('subject') || '';
    const sort = searchParams.get('sort') || 'mostUsed';

    const where: any = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (subject && subject !== '全部') {
      where.subject = subject;
    }

    const orderBy = sort === 'newest'
      ? { createdAt: 'desc' as const }
      : { useCount: 'desc' as const };

    const tools = await prisma.tool.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('获取工具列表错误:', error);
    return NextResponse.json({ error: '获取工具列表失败' }, { status: 500 });
  }
}
