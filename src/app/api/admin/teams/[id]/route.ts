import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const putHandler = withAuth(
  async (req, _payload, params) => {
    const { id } = params as { id: string };
    const { name, adminId } = await req.json();

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (adminId !== undefined) data.adminId = adminId;

    const team = await prisma.team.update({
      where: { id },
      data,
    });

    return NextResponse.json({ team });
  },
  { roles: ['super_admin'] },
);

const deleteHandler = withAuth(
  async (_req, _payload, params) => {
    const { id } = params as { id: string };
    await prisma.user.updateMany({
      where: { teamId: id },
      data: { teamId: null, role: 'free_user' },
    });
    await prisma.team.delete({ where: { id } });
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
