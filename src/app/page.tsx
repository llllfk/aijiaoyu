'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles, Zap, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { subjects } from '@/data/subjects';
import api from '@/lib/api-client';

interface Tool {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  subject: string;
  description: string;
  useCount: number;
}

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * ease));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCard({ value, label, suffix = '', icon: Icon }: { value: number; label: string; suffix?: string; icon: any }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="glass-card rounded-xl p-6 hover-lift">
      <Icon size={24} className="text-[var(--primary)] mb-3" />
      <div className="text-3xl font-bold gradient-text">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-[var(--muted-foreground)] mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [hotTools, setHotTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState({ tools: 7, teachers: 1280, uses: 58960, rating: 98 });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<Tool[]>('/tools?sort=useCount&limit=6');
        setHotTools(data);
      } catch {
        // fallback
      }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/tools?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/tools?subject=${encodeURIComponent(subjectId)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 dark:from-blue-600/20 dark:via-transparent dark:to-indigo-600/20" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm mb-8">
              <Sparkles size={16} className="text-[var(--primary)]" />
              <span className="text-[var(--muted-foreground)]">AI赋能的教育工具平台</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
              让每一堂课
              <br />
              都充满<span className="gradient-text">互动</span>
            </h1>

            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
              面向中小学教师的学科交互教学工具，随机点名、课堂计时、函数绘图、转盘抽奖…
              让课堂更生动，让学习更有趣。
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索工具，如：随机点名、函数绘图…"
                  className="w-full pl-12 pr-4 py-4 rounded-xl glass-card text-base focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                />
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
              >
                免费开始使用
                <ArrowRight size={18} />
              </Link>
              <Link
                href="#subjects"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl glass-card font-medium hover:bg-[var(--muted)] transition-colors"
              >
                浏览工具
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={stats.tools} label="教学工具" icon={Zap} />
          <StatCard value={stats.teachers} label="注册教师" icon={Users} />
          <StatCard value={stats.uses} label="累计使用" icon={Target} />
          <StatCard value={stats.rating} label="好评率" suffix="%" icon={Sparkles} />
        </div>
      </section>

      {/* Subjects */}
      <section id="subjects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">学科分类</h2>
          <p className="text-[var(--muted-foreground)]">覆盖17个学科，一站式教学工具集合</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
          {subjects.map((subject, index) => (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              onClick={() => handleSubjectClick(subject.id)}
              className="glass-card rounded-xl p-4 text-center hover-lift cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {subject.emoji}
              </div>
              <div className="text-xs font-medium text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                {subject.name}
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Hot Tools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">热门工具</h2>
            <p className="text-[var(--muted-foreground)]">老师们最常用的教学工具</p>
          </div>
          <Link
            href="/tools"
            className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/tools/${tool.id}`} className="block glass-card rounded-2xl p-6 hover-lift group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                    {tool.emoji}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                    {tool.subject}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {tool.useCount.toLocaleString()} 次使用
                  </span>
                  <span className="text-sm text-[var(--primary)] font-medium flex items-center gap-1">
                    开始使用 <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">为什么选择智学工具</h2>
          <p className="text-[var(--muted-foreground)]">专为一线教师打造的高效教学助手</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: '开箱即用',
              desc: '无需安装配置，打开浏览器即可使用，投屏课堂一键全屏，操作简单上手快。',
            },
            {
              icon: Target,
              title: '学科丰富',
              desc: '覆盖17个学科，从随机点名到函数绘图，从转盘抽奖到元素周期表，满足多元教学场景。',
            },
            {
              icon: Sparkles,
              title: '持续更新',
              desc: '每周都有新工具上线，根据教师反馈持续优化，AI赋能让教学更智能。',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white mb-5">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
