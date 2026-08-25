'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import RandomNameTool from './tools/random-name-tool';
import TimerTool from './tools/timer-tool';
import FunctionPlotterTool from './tools/function-plotter-tool';
import WheelTool from './tools/wheel-tool';
import GroupingTool from './tools/grouping-tool';
import MindMapTool from './tools/mindmap-tool';
import PeriodicTableTool from './tools/periodic-table-tool';
import InclinedPlaneTool from './tools/inclined-plane-tool';
import InclinedPlane3DTool from './tools/inclined-plane-3d-tool';

interface Props {
  tool: {
    id: string;
    slug: string;
    name: string;
  };
  isFullscreen?: boolean;
}

export default function ToolRenderer({ tool, isFullscreen = false }: Props) {
  const { user } = useAuth();

  // Record use count
  useEffect(() => {
    if (user && tool?.id) {
      fetch(`/api/tools/${tool.id}/use`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }).catch(() => {});
    }
  }, [tool?.id, user]);

  switch (tool.slug) {
    case 'random-name-picker':
      return <RandomNameTool isFullscreen={isFullscreen} />;
    case 'class-timer':
      return <TimerTool isFullscreen={isFullscreen} />;
    case 'function-plotter':
      return <FunctionPlotterTool isFullscreen={isFullscreen} />;
    case 'wheel-of-names':
      return <WheelTool isFullscreen={isFullscreen} />;
    case 'random-grouping':
      return <GroupingTool isFullscreen={isFullscreen} />;
    case 'mind-map':
      return <MindMapTool isFullscreen={isFullscreen} />;
    case 'periodic-table':
      return <PeriodicTableTool isFullscreen={isFullscreen} />;
    case 'inclined-plane':
      return <InclinedPlaneTool />;
    case 'inclined-plane-3d':
      return <InclinedPlane3DTool />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
          工具加载中...
        </div>
      );
  }
}
