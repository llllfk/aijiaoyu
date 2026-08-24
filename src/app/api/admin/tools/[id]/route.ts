import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const putHandler = withAuth(
  async (req, _payload, params) => {
    const { id } = params as { id: string };
    const { name, slug, emoji, subject, description, usage, isActive } = await req.json();

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (emoji !== undefined) data.emoji = emoji;
    if (subject !== undefined) data.subject = subject;
    if (description !== undefined) data.description = description;
    if (usage !== undefined) data.usage = usage;
    if (isActive !== undefined) data.isActive = isActive;

    const tool = await prisma.tool.update({ where: { id }, data });
    return NextResponse.json({ tool });
  },
  { roles: ['super_admin'] },
);

const deleteHandler = withAuth(
  async (_req, _payload, params) => {
    const { id } = params as { id: string };
    await prisma.tool.delete({ where: { id } });
    return NextResponse.json({ success: true });
  },
  { roles: ['super_admin'] },
);

export function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  return putHandler(req, context);
}

export function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  return deleteHandler(req, context);
}
