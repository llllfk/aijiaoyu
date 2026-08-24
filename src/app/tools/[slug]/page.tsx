'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';
import { getToolBySlug, getSubjectInfo } from '@/data/tools';
import { ToolRenderer } from '@/components/tool-renderer';

export default function ToolDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">工具未找到</h1>
        <p className="text-gray-500 mb-6">抱歉，您访问的工具不存在</p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工具列表
        </Link>
      </div>
    );
  }

  const subject = getSubjectInfo(tool.subject);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/tools"
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回工具列表</span>
        </Link>

        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 text-gray-500 text-sm transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">分享链接</span>
        </button>
      </div>

      {/* Tool Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow mb-6">
        <div className="flex items-start gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-4xl md:text-5xl flex-shrink-0">
            {tool.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${subject?.color || 'bg-gray-100 text-gray-700'}`}
              >
                {subject?.name || '其他'}
              </span>
              <span className="text-xs text-gray-400">
                {tool.usageCount.toLocaleString()} 次使用
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {tool.name}
            </h1>
            <p className="text-sm md:text-base text-gray-500">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="bg-white rounded-3xl card-shadow overflow-hidden mb-6">
        <ToolRenderer slug={slug} />
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📖 使用说明</h2>
        <div className="text-gray-600 text-sm md:text-base space-y-3">
          {slug === 'random-name' && (
            <>
              <p>1. 在顶部输入框中粘贴学生名单，每行一个名字，系统会自动保存到本地。</p>
              <p>2. 点击屏幕中央或按下空格键开始随机抽取，再次点击或按空格停止。</p>
              <p>3. 开启"不重复抽取"模式后，已抽到的同学不会再次出现。</p>
              <p>4. 点击"重置"按钮可清空已抽取记录，重新开始。</p>
              <p>5. 适合用于课堂提问、小组分组、随机展示等场景。</p>
            </>
          )}
          {slug === 'timer' && (
            <>
              <p>1. 选择倒计时或正计时模式，点击开始按钮启动计时。</p>
              <p>2. 倒计时模式：可通过快捷按钮快速设置时间，也可手动输入分钟和秒数。</p>
              <p>3. 正计时模式：支持计次（Lap）功能，记录多个时间点。</p>
              <p>4. 时间到后屏幕会闪烁提示，适合小组讨论、考试计时等场景。</p>
              <p>5. 全屏显示时配合投影仪使用效果最佳，后排学生也能清晰看到。</p>
            </>
          )}
          {slug === 'function-plotter' && (
            <>
              <p>1. 在输入框中输入函数表达式，例如 y=x^2、y=sin(x)、y=2x+1。</p>
              <p>2. 支持同时绘制最多3个函数，不同颜色区分，方便对比。</p>
              <p>3. 使用参数滑块可以实时调节函数中的 a、b 参数，观察图像变化。</p>
              <p>4. 鼠标滚轮可缩放画布，拖拽可平移坐标系。</p>
              <p>5. 支持的运算：+、-、*、/、^（幂）、sin、cos、tan、log、sqrt、abs、pi、e。</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
