import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const getHandler = withAuth(async (_req, payload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      teamId: true,
      favorites: true,
      createdAt: true,
      team: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ user });
});

const putHandler = withAuth(async (req, payload) => {
  const { nickname, password } = await req.json();

  const data: any = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data,
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      teamId: true,
      favorites: true,
    },
  });

  return NextResponse.json({ user });
});

export { getHandler as GET, putHandler as PUT };
