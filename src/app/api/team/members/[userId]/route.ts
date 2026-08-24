import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const removeHandler = withAuth(
  async (req, payload, params) => {
    if (payload.role !== 'team_admin') {
      return NextResponse.json({ error: '仅团队管理员可操作' }, { status: 403 });
    }
    if (!payload.teamId) {
      return NextResponse.json({ error: '您不在任何团队中' }, { status: 404 });
    }

    const { userId } = params as { userId: string };

    if (userId === payload.userId) {
      return NextResponse.json({ error: '不能移除自己' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.teamId !== payload.teamId) {
      return NextResponse.json({ error: '用户不在本团队' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null, role: 'free_user' },
    });

    return NextResponse.json({ success: true });
  },
  { roles: ['team_admin'] },
);

const roleHandler = withAuth(
  async (req, payload, params) => {
    if (payload.role !== 'team_admin') {
      return NextResponse.json({ error: '仅团队管理员可操作' }, { status: 403 });
    }
    if (!payload.teamId) {
      return NextResponse.json({ error: '您不在任何团队中' }, { status: 404 });
    }

    const { userId } = params as { userId: string };
    const { role } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.teamId !== payload.teamId) {
      return NextResponse.json({ error: '用户不在本团队' }, { status: 400 });
    }

    if (role === 'team_admin') {
      await prisma.team.update({
        where: { id: payload.teamId },
        data: { adminId: userId },
      });
      await prisma.user.updateMany({
        where: { teamId: payload.teamId, role: 'team_admin', NOT: { id: userId } },
        data: { role: 'team_user' },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role === 'team_admin' ? 'team_admin' : 'team_user' },
    });

    return NextResponse.json({ success: true });
  },
  { roles: ['team_admin'] },
);

export function DELETE(req: Request, context: { params: Promise<{ userId: string }> }) {
  return removeHandler(req, context);
}

export function PATCH(req: Request, context: { params: Promise<{ userId: string }> }) {
  return roleHandler(req, context);
}
