'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Mail, Lock, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createTeam, setCreateTeam] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    if (createTeam && !teamName.trim()) {
      setError('请输入团队名称');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, teamName: createTeam ? teamName.trim() : undefined });
      router.push('/tools');
    } catch (err: any) {
      setError(err.message || '注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              智
            </div>
            <h1 className="text-2xl font-bold mb-2">创建账号</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              加入智学工具，让教学更高效
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--destructive)]/10 text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">邮箱</label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">密码</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位密码"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">确认密码</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Team Option */}
            <div className="pt-2">
              <div
                onClick={() => setCreateTeam(!createTeam)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  createTeam
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                      createTeam
                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    {createTeam && <Check size={14} className="text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">创建我的团队</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      创建团队并成为管理员，邀请同事一起使用
                    </div>
                  </div>
                </div>
              </div>

              {createTeam && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-2">团队名称</label>
                    <div className="relative">
                      <Users
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                      />
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="例如：XX学校教研组"
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  注册中...
                </>
              ) : (
                '注册账号'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            已有账号？{' '}
            <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
              立即登录
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
