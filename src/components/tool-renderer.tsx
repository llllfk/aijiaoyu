'use client';

import { RandomNameTool } from '@/components/tools/random-name-tool';
import { TimerTool } from '@/components/tools/timer-tool';
import { FunctionPlotterTool } from '@/components/tools/function-plotter-tool';

interface ToolRendererProps {
  slug: string;
}

export function ToolRenderer({ slug }: ToolRendererProps) {
  switch (slug) {
    case 'random-name':
      return <RandomNameTool />;
    case 'timer':
      return <TimerTool />;
    case 'function-plotter':
      return <FunctionPlotterTool />;
    default:
      return (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">工具开发中</h3>
          <p className="text-gray-500">该工具正在紧锣密鼓地开发中，敬请期待！</p>
        </div>
      );
  }
}
