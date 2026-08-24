'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { User, Heart, Building2, Crown, Edit2, Check, Plus, ArrowRight } from 'lucide-react';
import api from '@/lib/api-client';

interface Tool {
  id: string;
  name: string;
  emoji: string;
  subject: string;
  description: string;
}

interface TeamMember {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
}

interface TeamInfo {
  id: string;
  name: string;
  adminEmail: string | null;
  members: TeamMember[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  team_admin: '团队管理员',
  team_user: '团队成员',
  free_user: '个人用户',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'favorites' | 'team'>('info');
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState<Tool[]>([]);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname || '');
    loadFavorites();
    if (user.teamId) {
      loadTeam();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const data = await api.get('/api/user/favorites');
      setFavorites((data as any).tools || []);
    } catch {
      // ignore
    }
  };

  const loadTeam = async () => {
    try {
      const data = await api.get('/api/team');
      setTeam((data as any).team);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const saveNickname = async () => {
    setSaving(true);
    try {
      await api.put('/api/user/profile', { nickname: nickname.trim() });
      setEditing(false);
      // Update auth context
      const res = await api.get('/api/auth/me');
      // The auth context should handle this - reload page or update
      window.location.reload();
    } catch {
      alert('保存失败');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-lg">{user.nickname || user.email}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
                <span
                  className={`mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.role === 'super_admin'
                      ? 'bg-red-500/20 text-red-400'
                      : user.role === 'team_admin'
                      ? 'bg-amber-500/20 text-amber-400'
                      : user.role === 'team_user'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>

              {user.teamId && team && (
                <div className="p-3 rounded-xl bg-[var(--muted)]/50 mb-4">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Building2 size={14} className="text-[var(--primary)]" />
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <button
                    onClick={() => router.push('/team')}
                    className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
                  >
                    进入团队 <ArrowRight size={12} />
                  </button>
                </div>
              )}

              <nav className="space-y-1">
                {[
                  { id: 'info', label: '基本信息', icon: User },
                  { id: 'favorites', label: '我的收藏', icon: Heart },
                  { id: 'team', label: '我的团队', icon: Building2 },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'gradient-bg text-white'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full mt-4 px-3 py-2.5 rounded-xl text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            <div className="glass-card rounded-2xl p-6">
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">基本信息</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">
                        邮箱
                      </label>
                      <div className="px-4 py-2.5 rounded-xl bg-[var(--muted)]/50 text-sm">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">
                        昵称
                      </label>
                      {editing ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl"
                            placeholder="设置一个昵称"
                          />
                          <button
                            onClick={saveNickname}
                            disabled={saving}
                            className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm flex items-center gap-1.5"
                          >
                            <Check size={14} />
                            保存
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="px-4 py-2.5 rounded-xl bg-[var(--muted)]/50 text-sm flex-1">
                            {user.nickname || '未设置昵称'}
                          </div>
                          <button
                            onClick={() => setEditing(true)}
                            className="p-2.5 rounded-xl hover:bg-[var(--muted)]"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">
                        角色
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)]/50 text-sm">
                        <Crown size={14} className="text-[var(--primary)]" />
                        {ROLE_LABELS[user.role] || user.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">我的收藏</h2>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={40} className="mx-auto mb-3 text-[var(--muted-foreground)]/30" />
                      <p className="text-[var(--muted-foreground)] mb-4">还没有收藏任何工具</p>
                      <button
                        onClick={() => router.push('/tools')}
                        className="px-4 py-2 rounded-xl gradient-bg text-white text-sm"
                      >
                        去发现工具
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {favorites.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => router.push(`/tools/${tool.id}`)}
                          className="p-4 rounded-xl bg-[var(--muted)]/30 hover:bg-[var(--muted)]/60 border border-[var(--border)]/50 cursor-pointer transition-all hover:-translate-y-0.5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{tool.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm">{tool.name}</h3>
                              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">我的团队</h2>
                  {loading ? (
                    <div className="text-center py-12 text-[var(--muted-foreground)]">加载中...</div>
                  ) : user.role === 'free_user' ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/50 flex items-center justify-center mx-auto mb-4">
                        <Building2 size={28} className="text-[var(--muted-foreground)]" />
                      </div>
                      <h3 className="font-semibold mb-2">还没有加入团队</h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto">
                        创建一个属于自己的团队，邀请同事一起使用教学工具
                      </p>
                      <button
                        onClick={() => router.push('/register')}
                        className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium flex items-center gap-2 mx-auto"
                      >
                        <Plus size={16} />
                        创建团队
                      </button>
                    </div>
                  ) : team ? (
                    <div>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--muted)]/30 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white">
                          <Building2 size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {team.members.length} 位成员
                            {team.adminEmail === user.email && ' · 你是管理员'}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push('/team')}
                          className="px-4 py-2 rounded-xl bg-[var(--muted)] text-sm hover:bg-[var(--muted)]/80"
                        >
                          管理团队
                        </button>
                      </div>

                      <h4 className="font-medium text-sm mb-3">成员列表</h4>
                      <div className="space-y-2">
                        {team.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/30"
                          >
                            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                              {m.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {m.nickname || m.email}
                                {m.role === 'team_admin' && (
                                  <span className="ml-2 text-xs text-amber-400">管理员</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
