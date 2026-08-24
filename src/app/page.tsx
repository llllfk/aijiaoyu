'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  ArrowRight,
  Zap,
  Lightbulb,
  Users,
  TrendingUp,
} from 'lucide-react';
import { subjects, tools } from '@/data/tools';
import { ToolCard } from '@/components/tool-card';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/tools');
    }
  };

  const hotTools = [...tools].sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="absolute top-10 -left-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-6">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-600">
                AI赋能的智慧教学平台
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                智学工坊
              </span>
              <br />
              <span className="text-3xl md:text-5xl">让课堂更有魔力</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed">
              面向中小学教师的学科交互教学工具，
              <br className="hidden sm:block" />
              随机点名、课堂计时、函数绘图…让每一堂课都充满惊喜
            </p>

            {/* Search Box */}
            <form
              onSubmit={handleSearch}
              className="relative max-w-xl mx-auto mb-10"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索教学工具，如：随机点名、计时器、函数绘图..."
                  className="w-full pl-14 pr-32 py-4 bg-white rounded-2xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none text-gray-700 placeholder-gray-400 shadow-lg shadow-indigo-100/50 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg"
                >
                  搜索
                </button>
              </div>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-gray-400">快速体验：</span>
              {tools.slice(0, 3).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="px-4 py-1.5 bg-white hover:bg-indigo-50 rounded-full border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-600 transition-all"
                >
                  {tool.emoji} {tool.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white rounded-3xl p-8 card-shadow grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Users className="w-6 h-6" />, value: '50,000+', label: '活跃教师' },
            { icon: <Zap className="w-6 h-6" />, value: '100万+', label: '累计使用' },
            { icon: <Lightbulb className="w-6 h-6" />, value: '50+', label: '学科工具' },
            { icon: <TrendingUp className="w-6 h-6" />, value: '99.9%', label: '好评率' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl text-indigo-600 mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Subject Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            按学科浏览
          </h2>
          <p className="text-gray-500">选择学科，快速找到你需要的教学工具</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {subjects.slice(1).map((subject) => (
            <Link
              key={subject.id}
              href={`/tools?subject=${subject.id}`}
              className="group bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 text-center border border-gray-50"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {subject.emoji}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {subject.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {tools.filter((t) => t.subject === subject.id).length} 个工具
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot Tools */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🔥 热门工具
            </h2>
            <p className="text-gray-500">老师们最常用的教学工具</p>
          </div>
          <Link
            href="/tools"
            className="hidden sm:flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-indigo-600 font-medium"
          >
            查看全部工具
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          {/* 装饰圆 */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full" />

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: '即开即用',
                desc: '无需安装，打开浏览器就能用，投影平板都适配',
              },
              {
                icon: '🎯',
                title: '精准高效',
                desc: '每个工具都针对课堂场景设计，操作简单不复杂',
              },
              {
                icon: '✨',
                title: '持续更新',
                desc: '不断新增学科工具，根据老师反馈持续优化',
              },
            ].map((feature, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
