import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthOptional } from '@/lib/with-auth';

export const POST = withAuthOptional(async (req, user, params) => {
  try {
    const { id } = params as { id: string };
    const tool = await prisma.tool.findUnique({
      where: { id },
    });

    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    await prisma.tool.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });

    if (user) {
      await prisma.usageLog.create({
        data: {
          toolId: id,
          userId: user.userId,
          teamId: user.teamId || undefined,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record use error:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
});
