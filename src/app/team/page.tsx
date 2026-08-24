'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Calendar,
  Mail,
  Crown,
  UserMinus,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import api from '@/lib/api-client';

interface Member {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  createdAt: string;
}

interface TeamInfo {
  id: string;
  name: string;
  adminEmail: string | null;
  members: Member[];
  createdAt: string;
  usageStats?: { toolId: string; toolName: string; count: number }[];
}

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'stats'>('members');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'team_admin' && user.role !== 'team_user') {
      router.replace('/profile');
      return;
    }
    setIsAdmin(user.role === 'team_admin');
    loadTeam();
  }, [user, router]);

  const loadTeam = async () => {
    try {
      const data = await api.get('/team');
      setTeam((data as any).team);
      setTeamName((data as any).team.name);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!teamName.trim()) return;
    try {
      await api.put('/team', { name: teamName.trim() });
      setEditingName(false);
      loadTeam();
    } catch (e: any) {
      alert(e?.message || '保存失败');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await api.post('/team/invite', { email: inviteEmail });
      setInviteLink((res as any).inviteLink || '');
      setInviteEmail('');
    } catch (e: any) {
      alert(e?.message || '邀请失败');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const toggleAdmin = async (memberId: string, isCurrentlyAdmin: boolean) => {
    if (!confirm(isCurrentlyAdmin ? '确定取消该成员的管理员权限？' : '确定设为管理员？')) return;
    try {
      await api.put(`/team/members/${memberId}`, {
        role: isCurrentlyAdmin ? 'team_user' : 'team_admin',
      });
      loadTeam();
    } catch (e: any) {
      alert(e?.message || '操作失败');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('确定移除该成员？')) return;
    try {
      await api.delete(`/team/members/${memberId}`);
      loadTeam();
    } catch (e: any) {
      alert(e?.message || '移除失败');
    }
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">加载中...</div>
        ) : !team ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted-foreground)]">未找到团队信息</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Info Card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white shadow-lg">
                  <Building2 size={28} />
                </div>
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-b border-[var(--primary)] outline-none px-1"
                      />
                      <button onClick={handleSaveName} className="text-sm text-[var(--success)]">
                        保存
                      </button>
                      <button onClick={() => { setEditingName(false); setTeamName(team.name); }} className="text-sm text-[var(--muted-foreground)]">
                        取消
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      {team.name}
                      {isAdmin && (
                        <button
                          onClick={() => setEditingName(true)}
                          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                        >
                          编辑
                        </button>
                      )}
                    </h1>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {team.members.length} 位成员
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> 创建于 {new Date(team.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--card)] rounded-xl p-1 w-fit">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'members' ? 'gradient-bg text-white' : 'text-[var(--muted-foreground)]'
                }`}
              >
                成员列表
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'stats' ? 'gradient-bg text-white' : 'text-[var(--muted-foreground)]'
                }`}
              >
                使用统计
              </button>
            </div>

            {/* Content */}
            <div className="glass-card rounded-2xl p-6">
              {activeTab === 'members' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">团队成员</h3>
                    {isAdmin && (
                      <button
                        onClick={() => setShowInvite(!showInvite)}
                        className="px-3 py-1.5 rounded-lg text-sm gradient-bg text-white flex items-center gap-1.5"
                      >
                        <Mail size={14} />
                        邀请成员
                      </button>
                    )}
                  </div>

                  {showInvite && isAdmin && (
                    <div className="mb-4 p-4 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
                      <div className="flex gap-2 mb-3">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="输入成员邮箱发送邀请"
                          className="flex-1 px-3 py-2 rounded-lg text-sm"
                        />
                        <button
                          onClick={handleInvite}
                          className="px-4 py-2 rounded-lg text-sm gradient-bg text-white"
                        >
                          发送邀请
                        </button>
                      </div>
                      {inviteLink && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--card)]">
                          <span className="text-sm text-[var(--muted-foreground)] truncate flex-1">
                            邀请链接：{inviteLink}
                          </span>
                          <button onClick={copyLink} className="p-1.5 hover:bg-[var(--muted)] rounded">
                            {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {team.members.map((m) => {
                      const memberIsAdmin = m.role === 'team_admin';
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/30"
                        >
                          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                            {m.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {m.nickname || m.email}
                              {memberIsAdmin && (
                                <Crown size={14} className="inline ml-2 text-amber-400" />
                              )}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">{m.email}</div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {memberIsAdmin ? '管理员' : '成员'}
                          </span>
                          {isAdmin && m.id !== user.id && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleAdmin(m.id, memberIsAdmin)}
                                className="text-xs text-[var(--primary)] hover:underline"
                              >
                                {memberIsAdmin ? '取消管理' : '设为管理'}
                              </button>
                              <button
                                onClick={() => removeMember(m.id)}
                                className="p-1.5 text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-lg"
                                title="移除成员"
                              >
                                <UserMinus size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h3 className="font-semibold mb-4">工具使用排行</h3>
                  {team.usageStats && team.usageStats.length > 0 ? (
                    <div className="space-y-3">
                      {team.usageStats.map((item, i) => (
                        <div key={item.toolId} className="flex items-center gap-3">
                          <span className="w-6 text-center text-sm font-bold text-[var(--muted-foreground)]">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.toolName}</span>
                              <span className="text-[var(--muted-foreground)]">{item.count}次</span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                              <div
                                className="h-full gradient-bg rounded-full"
                                style={{
                                  width: `${(item.count / (team.usageStats?.[0].count || 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[var(--muted-foreground)] py-8">暂无使用数据</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
