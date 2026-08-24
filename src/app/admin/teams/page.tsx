'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Plus, Users, Trash2 } from 'lucide-react';
import api from '@/lib/api-client';

interface Team {
  id: string;
  name: string;
  adminEmail: string | null;
  _count: { members: number };
  createdAt: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', adminEmail: '' });
  const [saving, setSaving] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/teams');
      setTeams((data as any).teams || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreate = async () => {
    if (!newTeam.name) return;
    setSaving(true);
    try {
      await api.post('/admin/teams', newTeam);
      setShowCreateModal(false);
      setNewTeam({ name: '', adminEmail: '' });
      loadTeams();
    } catch (e: any) {
      alert(e?.message || '创建失败');
    }
    setSaving(false);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('确定要解散该团队吗？所有成员将变为个人用户。')) return;
    try {
      await api.delete(`/admin/teams/${teamId}`);
      loadTeams();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">团队管理</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              共 {teams.length} 个团队
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            创建团队
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">团队名称</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">管理员</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">成员数</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">创建时间</th>
                  <th className="text-right font-medium text-[var(--muted-foreground)] px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[var(--muted-foreground)]">
                      加载中...
                    </td>
                  </tr>
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[var(--muted-foreground)]">
                      暂无团队
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                      <td className="px-5 py-3.5 font-medium">{t.name}</td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        {t.adminEmail || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">
                          <Users size={12} />
                          {t._count.members}人
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        {new Date(t.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-xs text-[var(--destructive)] hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={12} />
                          解散
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">创建团队</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">团队名称</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                  placeholder="如：第一实验小学教研组"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">管理员邮箱（可选）</label>
                <input
                  type="email"
                  value={newTeam.adminEmail}
                  onChange={(e) => setNewTeam({ ...newTeam, adminEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                  placeholder="已注册用户邮箱，留空则无管理员"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--muted)] text-sm"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newTeam.name}
                className="flex-1 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
