import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const handler = withAuth(async (_req, payload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      teamId: true,
      favorites: true,
      status: true,
      createdAt: true,
      team: { select: { id: true, name: true, adminId: true } },
    },
  });

  if (!user || user.status === 'disabled') {
    return NextResponse.json({ error: '用户不存在或已被禁用' }, { status: 404 });
  }

  return NextResponse.json({ user });
});

export { handler as GET };
