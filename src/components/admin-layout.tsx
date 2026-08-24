'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">加载中...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: '平台统计', icon: BarChart3, exact: true },
    { href: '/admin/users', label: '用户管理', icon: Users },
    { href: '/admin/teams', label: '团队管理', icon: Building2 },
    { href: '/admin/tools', label: '工具管理', icon: Wrench },
  ];

  const Sidebar = () => (
    <aside
      className={cn(
        'h-full flex flex-col bg-[var(--card)] border-r border-[var(--border)] transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
          智
        </div>
        {sidebarOpen && (
          <div className="ml-3 font-bold text-lg gradient-text">管理后台</div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto p-1.5 rounded-lg hover:bg-[var(--muted)] hidden md:block"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'gradient-bg text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{user.email}</div>
              <div className="text-xs text-[var(--muted-foreground)]">超级管理员</div>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors',
            !sidebarOpen && 'justify-center'
          )}
        >
          <LogOut size={16} />
          {sidebarOpen && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 md:hidden">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="h-16 border-b border-[var(--border)] flex items-center px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-[var(--muted)]"
          >
            <Menu size={20} />
          </button>
          <span className="ml-2 font-bold">管理后台</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
