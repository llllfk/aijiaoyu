import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const getHandler = withAuth(
  async (_req, payload) => {
    if (!payload.teamId) {
      return NextResponse.json({ error: '您不在任何团队中' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: payload.teamId },
      include: {
        members: {
          select: { id: true, email: true, nickname: true, role: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: '团队不存在' }, { status: 404 });
    }

    return NextResponse.json({ team });
  },
  { roles: ['team_admin', 'team_user'] },
);

const putHandler = withAuth(
  async (req, payload) => {
    if (payload.role !== 'team_admin') {
      return NextResponse.json({ error: '仅团队管理员可操作' }, { status: 403 });
    }
    if (!payload.teamId) {
      return NextResponse.json({ error: '您不在任何团队中' }, { status: 404 });
    }

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: '团队名称不能为空' }, { status: 400 });
    }

    const team = await prisma.team.update({
      where: { id: payload.teamId },
      data: { name: name.trim() },
    });

    return NextResponse.json({ team });
  },
  { roles: ['team_admin'] },
);

export { getHandler as GET, putHandler as PUT };
