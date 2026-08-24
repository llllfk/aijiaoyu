import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import type { Tool } from '@/data/tools';
import { getSubjectInfo } from '@/data/tools';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const subject = getSubjectInfo(tool.subject);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 border border-gray-50"
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
          {tool.emoji}
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${subject?.color || 'bg-gray-100 text-gray-700'}`}
        >
          {subject?.name || '其他'}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
        {tool.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
        {tool.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span>{tool.usageCount.toLocaleString()} 次使用</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
          立即使用
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
