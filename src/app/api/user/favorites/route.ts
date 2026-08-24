import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const postHandler = withAuth(async (req, payload) => {
  const { toolId } = await req.json();
  if (!toolId) {
    return NextResponse.json({ error: '工具ID不能为空' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let favorites: string[] = [];
  try {
    favorites = JSON.parse(user.favorites || '[]');
  } catch {
    favorites = [];
  }

  if (!favorites.includes(toolId)) {
    favorites.push(toolId);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { favorites: JSON.stringify(favorites) },
    });
  }

  return NextResponse.json({ favorites });
});

const deleteHandler = withAuth(async (req, payload) => {
  const { toolId } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let favorites: string[] = [];
  try {
    favorites = JSON.parse(user.favorites || '[]');
  } catch {
    favorites = [];
  }

  favorites = favorites.filter((id) => id !== toolId);
  await prisma.user.update({
    where: { id: payload.userId },
    data: { favorites: JSON.stringify(favorites) },
  });

  return NextResponse.json({ favorites });
});

export { postHandler as POST, deleteHandler as DELETE };
