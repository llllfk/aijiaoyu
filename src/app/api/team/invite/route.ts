import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const inviteHandler = withAuth(
  async (req, payload) => {
    if (payload.role !== 'team_admin') {
      return NextResponse.json({ error: '仅团队管理员可邀请' }, { status: 403 });
    }
    if (!payload.teamId) {
      return NextResponse.json({ error: '您不在任何团队中' }, { status: 404 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 用户不存在，创建一个带随机密码的用户
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: email.split('@')[0],
          role: 'team_user',
          teamId: payload.teamId,
        },
      });
      return NextResponse.json({ success: true, message: '用户已创建并加入团队，初始密码已生成' });
    }

    if (user.teamId) {
      return NextResponse.json({ error: '该用户已加入其他团队' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { teamId: payload.teamId, role: 'team_user' },
    });

    return NextResponse.json({ success: true, message: '已加入团队成功' });
  },
  { roles: ['team_admin'] },
);

export { inviteHandler as POST };
