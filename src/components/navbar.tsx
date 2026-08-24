'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Sun, Moon, Menu, X, LogOut, User, Settings, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/tools', label: '工具库' },
    { href: '/about', label: '关于' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const roleLabel: Record<string, string> = {
    super_admin: '超级管理员',
    team_admin: '团队管理员',
    team_user: '团队成员',
    free_user: '免费用户',
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)]'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg">
                智
              </div>
              <span className="font-bold text-xl hidden sm:block">
                智学<span className="gradient-text">工具</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[var(--muted)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-medium">
                    {user.nickname?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl overflow-hidden z-50 shadow-xl">
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <div className="font-medium text-sm">
                          {user.nickname || user.email}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {roleLabel[user.role] || user.role}
                        </div>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            router.push('/profile');
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--muted)] transition-colors"
                        >
                          <User size={16} /> 个人中心
                        </button>
                        {user.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              router.push('/admin');
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--muted)] transition-colors"
                          >
                            <Settings size={16} /> 管理后台
                          </button>
                        )}
                        {(user.role === 'team_admin' || user.role === 'team_user') && (
                          <button
                            onClick={() => {
                              router.push('/team');
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--muted)] transition-colors"
                          >
                            <Users size={16} /> 我的团队
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[var(--destructive)] hover:bg-[var(--muted)] transition-colors"
                        >
                          <LogOut size={16} /> 退出登录
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity"
              >
                登录
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium',
                  isActive(link.href)
                    ? 'bg-[var(--muted)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
