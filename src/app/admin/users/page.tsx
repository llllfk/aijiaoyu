'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Search, UserPlus, Ban, Key } from 'lucide-react';
import api from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  status: string;
  teamName: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: '超管', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  team_admin: { label: '团队管理', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  team_user: { label: '团队成员', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  free_user: { label: '个人用户', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'free_user' });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/admin/users${search ? `?search=${search}` : ''}`);
      setUsers((data as any).users || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const toggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await api.put(`/api/admin/users/${userId}`, {
        status: currentStatus === 'active' ? 'disabled' : 'active',
      });
      loadUsers();
    } catch {
      alert('操作失败');
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}`, { role: newRole });
      loadUsers();
    } catch {
      alert('操作失败');
    }
  };

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) return;
    setSaving(true);
    try {
      await api.post('/api/admin/users', newUser);
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', role: 'free_user' });
      loadUsers();
    } catch (e: any) {
      alert(e?.message || '创建失败');
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">用户管理</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              共 {users.length} 位用户
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus size={16} />
            新增用户
          </button>
        </div>

        {/* Search */}
        <div className="glass-card rounded-2xl p-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索邮箱或昵称…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">用户</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">角色</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">团队</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">状态</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">注册时间</th>
                  <th className="text-right font-medium text-[var(--muted-foreground)] px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--muted-foreground)]">
                      加载中...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--muted-foreground)]">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.free_user;
                    return (
                      <tr key={u.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{u.nickname || u.email}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-full border font-medium cursor-pointer',
                              roleInfo.color
                            )}
                          >
                            <option value="free_user">个人用户</option>
                            <option value="team_user">团队成员</option>
                            <option value="team_admin">团队管理</option>
                            <option value="super_admin">超管</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {u.teamName || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'text-xs px-2.5 py-1 rounded-full',
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          )}>
                            {u.status === 'active' ? '正常' : '已禁用'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => toggleStatus(u.id, u.status)}
                            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                          >
                            {u.status === 'active' ? '禁用' : '启用'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
            <h3 className="text-lg font-bold mb-4">新增用户</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">邮箱</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">初始密码</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                  placeholder="至少6位"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">角色</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                >
                  <option value="free_user">个人用户</option>
                  <option value="team_user">团队成员</option>
                  <option value="team_admin">团队管理员</option>
                  <option value="super_admin">超级管理员</option>
                </select>
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
                disabled={saving || !newUser.email || !newUser.password}
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
