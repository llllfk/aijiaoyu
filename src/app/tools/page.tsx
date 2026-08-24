'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Grid, PanelLeftClose, PanelLeft } from 'lucide-react';
import { subjects, tools, type Subject } from '@/data/tools';
import { ToolCard } from '@/components/tool-card';
import { cn } from '@/lib/utils';

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const initialSubject = (searchParams.get('subject') as Subject) || 'all';
  const initialQ = searchParams.get('q') || '';

  const [activeSubject, setActiveSubject] = useState<Subject>(initialSubject);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 同步URL参数到状态
  useEffect(() => {
    setActiveSubject((searchParams.get('subject') as Subject) || 'all');
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const filteredTools = useMemo(() => {
    let result = tools;

    if (activeSubject !== 'all') {
      result = result.filter((t) => t.subject === activeSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }

    return result;
  }, [activeSubject, searchQuery]);

  const subjectCount = (subjectId: Subject) => {
    if (subjectId === 'all') return tools.length;
    return tools.filter((t) => t.subject === subjectId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          教学工具库
        </h1>
        <p className="text-gray-500">
          共 {tools.length} 个工具，找到 {filteredTools.length} 个匹配结果
        </p>
      </div>

      {/* Mobile: Subject Tabs */}
      <div className="md:hidden mb-6 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                activeSubject === s.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200',
              )}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Search Bar */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden md:block transition-all duration-300',
            sidebarOpen ? 'w-56 flex-shrink-0' : 'w-0 overflow-hidden',
          )}
        >
          <div className="bg-white rounded-2xl p-4 card-shadow sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                学科分类
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="收起侧边栏"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <nav className="space-y-1">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubject(s.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    activeSubject === s.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      activeSubject === s.id
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {subjectCount(s.id)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Desktop: Search & Toggle */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 bg-white rounded-xl card-shadow hover:bg-gray-50 transition-colors"
                title="展开侧边栏"
              >
                <PanelLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工具名称或描述..."
                className="w-full pl-12 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                没有找到相关工具
              </h3>
              <p className="text-gray-500 mb-4">
                试试其他关键词或换个学科分类看看
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveSubject('all');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                查看全部工具
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
