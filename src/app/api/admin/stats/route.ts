import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { prisma } from '@/lib/prisma';

const getHandler = withAuth(
  async () => {
    const [totalUsers, totalTeams, totalTools, totalUsage] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.tool.count(),
      prisma.usageLog.count(),
    ]);

    // 最近30天使用趋势
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageLogs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    // 按天统计
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, 0);
    }

    usageLogs.forEach((log) => {
      const key = log.createdAt.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    });

    const usageTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      stats: { totalUsers, totalTeams, totalTools, totalUsage },
      usageTrend,
    });
  },
  { roles: ['super_admin'] },
);

export { getHandler as GET };
