import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/with-auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tool = await prisma.tool.findUnique({
      where: { id },
    });

    if (!tool || !tool.isActive) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error('获取工具详情错误:', error);
    return NextResponse.json({ error: '获取工具详情失败' }, { status: 500 });
  }
}

const useHandler = withAuth(async (req, payload, params) => {
  try {
    const { id } = params as { id: string };
    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    await prisma.tool.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });

    await prisma.usageLog.create({
      data: {
        toolId: id,
        userId: payload.userId,
        teamId: payload.teamId || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录使用错误:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  return useHandler(req, context);
}
