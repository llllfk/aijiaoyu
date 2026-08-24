import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const putHandler = withAuth(
  async (req, _payload, params) => {
    const { id } = params as { id: string };
    const { nickname, role, teamId, status } = await req.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        nickname: nickname !== undefined ? nickname : undefined,
        role: role !== undefined ? role : undefined,
        teamId: teamId !== undefined ? teamId : undefined,
        status: status !== undefined ? status : undefined,
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

const deleteHandler = withAuth(
  async (_req, _payload, params) => {
    const { id } = params as { id: string };
    await prisma.user.delete({ where: { id } });
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
