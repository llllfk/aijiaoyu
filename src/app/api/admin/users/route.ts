import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const getHandler = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = {};
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { nickname: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { team: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      role: u.role,
      teamId: u.teamId,
      team: u.team,
      status: u.status,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: safeUsers, total, page, pageSize });
  },
  { roles: ['super_admin'] },
);

const postHandler = withAuth(
  async (req) => {
    const { email, password, nickname, role, teamId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname || email.split('@')[0],
        role: role || 'free_user',
        teamId: teamId || null,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        teamId: user.teamId,
        status: user.status,
      },
    });
  },
  { roles: ['super_admin'] },
);

export { getHandler as GET, postHandler as POST };
