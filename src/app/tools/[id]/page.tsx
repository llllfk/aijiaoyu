'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api-client';
import ToolRenderer from '@/components/tool-renderer';
import { useAuth } from '@/contexts/auth-context';

interface Tool {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  subject: string;
  description: string;
  usage: string;
  useCount: number;
}

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<Tool>(`/tools/${params.id}`);
        setTool(data);

        // record use
        try {
          await api.post(`/tools/${params.id}/use`, {});
        } catch {
          // ignore
        }
      } catch {
        setTool(null);
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  useEffect(() => {
    if (user && tool) {
      try {
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favs.includes(tool.id));
      } catch {
        // ignore
      }
    }
  }, [user, tool]);

  const toggleFavorite = async () => {
    if (!tool) return;
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      if (isFavorite) {
        await api.delete('/user/favorites', { toolId: tool.id });
      } else {
        await api.post('/user/favorites', { toolId: tool.id });
      }
      setIsFavorite(!isFavorite);

      // also update localStorage
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (isFavorite) {
        localStorage.setItem(
          'favorites',
          JSON.stringify(favs.filter((id: string) => id !== tool.id))
        );
      } else {
        localStorage.setItem('favorites', JSON.stringify([...favs, tool.id]));
      }
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">❓</div>
        <h2 className="text-2xl font-bold mb-2">工具不存在</h2>
        <p className="text-[var(--muted-foreground)] mb-6">您访问的工具不存在或已被移除</p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-medium"
        >
          <ArrowLeft size={18} /> 返回工具库
        </Link>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-[var(--background)]' : ''}>
      {!isFullscreen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> 返回工具库
          </Link>
        </div>
      )}

      {/* Tool Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-4xl flex-shrink-0">
            {tool.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{tool.name}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                {tool.subject}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{tool.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-[var(--destructive)]/10 text-[var(--destructive)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
              title={isFavorite ? '取消收藏' : '收藏'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center transition-colors"
              title="分享"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl gradient-bg text-white flex items-center justify-center transition-opacity hover:opacity-90"
              title={isFullscreen ? '退出全屏' : '全屏模式'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={() => setShowUsage(!showUsage)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-sm font-medium hover:bg-[var(--muted)]/80 transition-colors"
            >
              <BookOpen size={16} />
              使用说明
            </button>
          </div>
        </div>
      </div>

      {/* Usage Panel */}
      <AnimatePresence>
        {showUsage && tool.usage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6"
          >
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen size={18} className="text-[var(--primary)]" />
                使用说明
              </h3>
              <div className="text-sm text-[var(--muted-foreground)] whitespace-pre-line leading-relaxed">
                {tool.usage}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div
          className={`glass-card rounded-2xl overflow-hidden ${
            isFullscreen ? 'rounded-none border-0 h-screen' : 'min-h-[500px]'
          }`}
        >
          <ToolRenderer tool={tool} isFullscreen={isFullscreen} />
        </div>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium z-50"
          >
            链接已复制到剪贴板
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
