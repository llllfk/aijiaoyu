import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, nickname, teamName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '邮箱已被注册' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let teamId: string | undefined;
    let role = 'free_user';

    if (teamName && teamName.trim()) {
      const team = await prisma.team.create({
        data: { name: teamName.trim() },
      });
      teamId = team.id;
      role = 'team_admin';

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: nickname || email.split('@')[0],
          role,
          teamId,
        },
      });

      await prisma.team.update({
        where: { id: team.id },
        data: { adminId: user.id },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: nickname || email.split('@')[0],
          role,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          teamId: user.teamId,
        },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
