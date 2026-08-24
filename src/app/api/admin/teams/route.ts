import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const getHandler = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const where: any = {};
    if (q) {
      where.name = { contains: q };
    }

    const teams = await prisma.team.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        members: { select: { id: true, email: true, nickname: true, role: true } },
      },
    });

    const teamsWithCount = teams.map((t) => ({
      ...t,
      memberCount: t.members.length,
    }));

    return NextResponse.json({ teams: teamsWithCount });
  },
  { roles: ['super_admin'] },
);

const postHandler = withAuth(
  async (req) => {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: '团队名称不能为空' }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ team });
  },
  { roles: ['super_admin'] },
);

export { getHandler as GET, postHandler as POST };
