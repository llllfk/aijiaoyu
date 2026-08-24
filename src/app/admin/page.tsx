'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Users, Building2, Wrench, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((res: any) => {
      setStats(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: '总用户数', value: stats?.totalUsers || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '团队数', value: stats?.totalTeams || 0, icon: Building2, color: 'from-purple-500 to-purple-600' },
    { label: '工具数', value: stats?.totalTools || 0, icon: Wrench, color: 'from-cyan-500 to-cyan-600' },
    { label: '总使用次数', value: stats?.totalUsage || 0, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">平台统计</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            实时查看平台运营数据
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                  <card.icon size={22} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{loading ? '—' : card.value}</div>
              <div className="text-sm text-[var(--muted-foreground)]">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">30天使用趋势</h3>
          <div className="h-72">
            {stats?.usageTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.usageTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#8892A4" fontSize={12} />
                  <YAxis stroke="#8892A4" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 14, 26, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
