'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subjects } from '@/data/subjects';
import api from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface Tool {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  subject: string;
  description: string;
  useCount: number;
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all');
  const [sortBy, setSortBy] = useState<'useCount' | 'createdAt'>('useCount');
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedSubject !== 'all') params.set('subject', selectedSubject);
        params.set('sort', sortBy);
        const data = await api.get<Tool[]>(`/tools?${params.toString()}`);
        setTools(data);
      } catch {
        setTools([]);
      }
      setLoading(false);
    };

    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject, sortBy]);

  const handleUse = async (toolId: string) => {
    try {
      if (user) {
        await api.post(`/tools/${toolId}/use`, {});
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">工具库</h1>
        <p className="text-[var(--muted-foreground)]">探索丰富的教学工具，让课堂更精彩</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具名称或简介…"
            className="w-full pl-11 pr-4 py-3 rounded-xl glass-card text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden px-4 py-3 rounded-xl glass-card text-sm font-medium flex items-center gap-2"
          >
            <Filter size={16} /> 筛选
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'useCount' | 'createdAt')}
            className="px-4 py-3 rounded-xl glass-card text-sm font-medium cursor-pointer"
          >
            <option value="useCount">最多使用</option>
            <option value="createdAt">最新添加</option>
          </select>
        </div>
      </div>

      {/* Subject Tabs (mobile/tablet - horizontal scroll) */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4 mb-6 pb-2">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSubject === 'all'
                ? 'gradient-bg text-white'
                : 'glass-card text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            全部
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSubject === s.id
                  ? 'gradient-bg text-white'
                  : 'glass-card text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - desktop only */}
        <aside
          className={`lg:block lg:w-56 lg:flex-shrink-0 ${
            showSidebar ? 'block' : 'hidden'
          } lg:sticky lg:top-24 lg:self-start`}
        >
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 px-2">学科分类</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  selectedSubject === 'all'
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>📚</span> 全部工具
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedSubject === s.id
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span>{s.emoji}</span> {s.name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Tool Grid */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass-card rounded-xl p-6 h-48 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-[var(--muted)] mb-4" />
                    <div className="h-5 w-32 bg-[var(--muted)] rounded mb-2" />
                    <div className="h-4 w-full bg-[var(--muted)] rounded mb-1" />
                    <div className="h-4 w-3/4 bg-[var(--muted)] rounded" />
                  </div>
                ))}
              </div>
            ) : tools.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">没有找到相关工具</h3>
                <p className="text-[var(--muted-foreground)] text-sm">
                  试试其他关键词或学科分类
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {tools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Link
                      href={`/tools/${tool.id}`}
                      onClick={() => handleUse(tool.id)}
                      className="block glass-card rounded-xl p-6 hover-lift group h-full flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {tool.emoji}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                          {tool.subject}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-[var(--primary)] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4 flex-1">
                        {tool.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {tool.useCount.toLocaleString()} 次使用
                        </span>
                        <span className="text-sm text-[var(--primary)] font-medium flex items-center gap-1">
                          开始使用
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ToolsContent />
    </Suspense>
  );
}
