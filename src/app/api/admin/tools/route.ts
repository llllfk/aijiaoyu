import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const getHandler = withAuth(
  async () => {
    const tools = await prisma.tool.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tools });
  },
  { roles: ['super_admin'] },
);

const postHandler = withAuth(
  async (req) => {
    const { name, slug, emoji, subject, description, usage } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: '名称和标识不能为空' }, { status: 400 });
    }

    const existing = await prisma.tool.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: '标识已存在' }, { status: 400 });
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        emoji: emoji || '🔧',
        subject: subject || '其他',
        description: description || '',
        usage: usage || '',
      },
    });

    return NextResponse.json({ tool });
  },
  { roles: ['super_admin'] },
);

export { getHandler as GET, postHandler as POST };
