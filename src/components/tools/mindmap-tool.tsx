'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, RotateCcw, Download, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isFullscreen?: boolean;
}

interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  level: number;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;
const LEVEL_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.2)', border: '#3B82F6', text: '#E8ECF4' },
  { bg: 'rgba(139, 92, 246, 0.15)', border: '#8B5CF6', text: '#E8ECF4' },
  { bg: 'rgba(6, 182, 212, 0.15)', border: '#06B6D4', text: '#E8ECF4' },
  { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', text: '#E8ECF4' },
];

function createInitialNodes(): { nodes: MindNode[]; rootId: string } {
  const rootId = 'root';
  const nodes: MindNode[] = [
    {
      id: rootId,
      text: '中心主题',
      x: 0,
      y: 0,
      parentId: null,
      children: ['child-1', 'child-2'],
      level: 0,
    },
    {
      id: 'child-1',
      text: '分支一',
      x: -200,
      y: -80,
      parentId: rootId,
      children: ['grandchild-1'],
      level: 1,
    },
    {
      id: 'child-2',
      text: '分支二',
      x: 200,
      y: -80,
      parentId: rootId,
      children: [],
      level: 1,
    },
    {
      id: 'grandchild-1',
      text: '子主题',
      x: -320,
      y: -120,
      parentId: 'child-1',
      children: [],
      level: 2,
    },
  ];
  return { nodes, rootId };
}

export default function MindMapTool({ isFullscreen = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [rootId, setRootId] = useState('root');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0, viewX: 0, viewY: 0 });
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });
  const nextIdRef = useRef(100);

  // Initialize
  useEffect(() => {
    const { nodes: initialNodes, rootId: initialRootId } = createInitialNodes();
    setNodes(initialNodes);
    setRootId(initialRootId);
  }, []);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          w: Math.floor(rect.width),
          h: isFullscreen ? window.innerHeight - 64 : 450,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return;

      if (e.key === 'Tab' && selectedId) {
        e.preventDefault();
        addChild(selectedId);
      } else if (e.key === 'Enter' && selectedId) {
        e.preventDefault();
        const node = nodes.find((n) => n.id === selectedId);
        if (node && node.parentId) {
          addSibling(selectedId);
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteNode(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, nodes]);

  const addChild = (parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const newId = `node-${nextIdRef.current++}`;
    const childCount = parent.children.length;
    const newLevel = parent.level + 1;

    const newNode: MindNode = {
      id: newId,
      text: '新主题',
      x: parent.x + 180,
      y: parent.y + childCount * 50 - (childCount * 50) / 2,
      parentId,
      children: [],
      level: Math.min(newLevel, LEVEL_COLORS.length - 1),
    };

    setNodes((prev) => [
      ...prev.map((n) => (n.id === parentId ? { ...n, children: [...n.children, newId] } : n)),
      newNode,
    ]);
    setSelectedId(newId);
    setEditingId(newId);
    setEditText('新主题');
  };

  const addSibling = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node?.parentId) return;
    addChild(node.parentId);
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === rootId) return;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Collect all descendants
    const toDelete = new Set<string>();
    const collect = (id: string) => {
      toDelete.add(id);
      const n = nodes.find((nn) => nn.id === id);
      if (n) n.children.forEach(collect);
    };
    collect(nodeId);

    // Remove from parent
    setNodes((prev) =>
      prev
        .filter((n) => !toDelete.has(n.id))
        .map((n) =>
          n.id === node.parentId
            ? { ...n, children: n.children.filter((c) => c !== nodeId) }
            : n
        )
    );
    setSelectedId(node.parentId);
  };

  const startEdit = (node: MindNode) => {
    setSelectedId(node.id);
    setEditingId(node.id);
    setEditText(node.text);
  };

  const finishEdit = () => {
    if (editingId && editText.trim()) {
      setNodes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text: editText.trim() } : n))
      );
    }
    setEditingId(null);
  };

  const autoLayout = () => {
    if (nodes.length === 0) return;

    // Calculate subtree sizes
    const subtreeHeight: Record<string, number> = {};

    const calcHeight = (nodeId: string): number => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.children.length === 0) {
        subtreeHeight[nodeId] = NODE_HEIGHT + 20;
        return subtreeHeight[nodeId];
      }
      let total = 0;
      node.children.forEach((cid) => {
        total += calcHeight(cid);
      });
      subtreeHeight[nodeId] = Math.max(total, NODE_HEIGHT + 20);
      return subtreeHeight[nodeId];
    };

    calcHeight(rootId);

    const newNodes = [...nodes];
    const levelWidth = 200;

    const position = (nodeId: string, x: number, yStart: number) => {
      const node = newNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const height = subtreeHeight[nodeId];
      const yCenter = yStart + height / 2;

      const idx = newNodes.findIndex((n) => n.id === nodeId);
      newNodes[idx] = { ...node, x, y: yCenter };

      let currentY = yStart;
      node.children.forEach((cid) => {
        const childHeight = subtreeHeight[cid];
        position(cid, x + levelWidth, currentY);
        currentY += childHeight;
      });
    };

    const totalHeight = subtreeHeight[rootId];
    position(rootId, 0, -totalHeight / 2);

    setNodes(newNodes);
    setView({ x: canvasSize.w / 2 - 100, y: canvasSize.h / 2, scale: 1 });
  };

  const resetView = () => {
    setView({ x: canvasSize.w / 2 - 100, y: canvasSize.h / 2, scale: 1 });
  };

  const zoomIn = () => {
    setView((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }));
  };

  const zoomOut = () => {
    setView((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.3) }));
  };

  // Export PNG
  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;

    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x - NODE_WIDTH / 2);
      minY = Math.min(minY, n.y - NODE_HEIGHT / 2);
      maxX = Math.max(maxX, n.x + NODE_WIDTH / 2);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT / 2);
    });
    const padding = 40;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    // Create a new SVG for export
    const svgNS = 'http://www.w3.org/2000/svg';
    const exportSvg = document.createElementNS(svgNS, 'svg');
    exportSvg.setAttribute('width', String(w));
    exportSvg.setAttribute('height', String(h));
    exportSvg.setAttribute('xmlns', svgNS);

    // Background
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#0A0E1A');
    exportSvg.appendChild(bg);

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${-minX + padding}, ${-minY + padding})`);

    // Connections
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (parent) {
          const path = document.createElementNS(svgNS, 'path');
          const sx = parent.x + NODE_WIDTH / 2;
          const sy = parent.y;
          const ex = node.x - NODE_WIDTH / 2;
          const ey = node.y;
          const mx = (sx + ex) / 2;
          const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
          path.setAttribute('d', d);
          path.setAttribute('stroke', 'rgba(148, 163, 184, 0.4)');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          g.appendChild(path);
        }
      }
    });

    // Nodes
    nodes.forEach((node) => {
      const colors = LEVEL_COLORS[node.level] || LEVEL_COLORS[LEVEL_COLORS.length - 1];
      const g2 = document.createElementNS(svgNS, 'g');

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', String(node.x - NODE_WIDTH / 2));
      rect.setAttribute('y', String(node.y - NODE_HEIGHT / 2));
      rect.setAttribute('width', String(NODE_WIDTH));
      rect.setAttribute('height', String(NODE_HEIGHT));
      rect.setAttribute('rx', '10');
      rect.setAttribute('fill', colors.bg);
      rect.setAttribute('stroke', colors.border);
      rect.setAttribute('stroke-width', selectedId === node.id ? '2.5' : '1.5');
      g2.appendChild(rect);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', String(node.x));
      text.setAttribute('y', String(node.y + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', colors.text);
      text.setAttribute('font-size', '14');
      text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      text.textContent = node.text;
      g2.appendChild(text);

      g.appendChild(g2);
    });

    exportSvg.appendChild(g);

    const svgData = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'mindmap.png';
        link.href = pngUrl;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent, node?: MindNode) => {
    if (node) {
      if (e.detail === 2) return; // double click handled separately
      setIsDragging(true);
      setSelectedId(node.id);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
        viewX: 0,
        viewY: 0,
      };
    } else {
      setIsPanning(true);
      setSelectedId(null);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        nodeX: 0,
        nodeY: 0,
        viewX: view.x,
        viewY: view.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.current.x) / view.scale;
      const dy = (e.clientY - dragStart.current.y) / view.scale;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? { ...n, x: dragStart.current.nodeX + dx, y: dragStart.current.nodeY + dy }
            : n
        )
      );
    } else if (isPanning) {
      setView((prev) => ({
        ...prev,
        x: dragStart.current.viewX + (e.clientX - dragStart.current.x),
        y: dragStart.current.viewY + (e.clientY - dragStart.current.y),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, view.scale * factor));

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const worldX = (mx - view.x) / view.scale;
    const worldY = (my - view.y) / view.scale;

    setView({
      x: mx - worldX * newScale,
      y: my - worldY * newScale,
      scale: newScale,
    });
  };

  const fullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Render connections
  const renderConnections = () => {
    return nodes.map((node) => {
      if (!node.parentId) return null;
      const parent = nodes.find((n) => n.id === node.parentId);
      if (!parent) return null;

      const sx = parent.x + NODE_WIDTH / 2;
      const sy = parent.y;
      const ex = node.x - NODE_WIDTH / 2;
      const ey = node.y;
      const mx = (sx + ex) / 2;
      const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;

      return (
        <path
          key={`conn-${node.id}`}
          d={d}
          stroke="rgba(148, 163, 184, 0.4)"
          strokeWidth={2}
          fill="none"
        />
      );
    });
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">思维导图</span>
          <span className="text-xs text-[var(--muted-foreground)]/60">
            Tab加子节点 · Enter加同级 · Delete删除
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-2 rounded-lg hover:bg-[var(--muted)]"
            title="缩小"
          >
            <Minus size={16} />
          </button>
          <span className="text-xs text-[var(--muted-foreground)] w-12 text-center">
            {Math.round(view.scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg hover:bg-[var(--muted)]"
            title="放大"
          >
            <Plus size={16} />
          </button>
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-[var(--muted)]"
            title="重置视图"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={autoLayout}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--muted)] hover:bg-[var(--muted)]/80 ml-1"
          >
            自动布局
          </button>
          <button
            onClick={exportPng}
            className="px-3 py-1.5 rounded-lg text-xs gradient-bg text-white flex items-center gap-1.5 ml-2"
          >
            <Download size={14} /> 导出PNG
          </button>
          <button
            onClick={fullscreenToggle}
            className="p-2 rounded-lg hover:bg-[var(--muted)] ml-1"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onWheel={handleWheel}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="block"
          style={{ cursor: isDragging ? 'move' : isPanning ? 'grabbing' : 'grab' }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
            {renderConnections()}

            {nodes.map((node) => {
              const colors = LEVEL_COLORS[node.level] || LEVEL_COLORS[LEVEL_COLORS.length - 1];
              const isSelected = selectedId === node.id;
              const isEditing = editingId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!isEditing) handleMouseDown(e, node);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEdit(node);
                  }}
                  style={{ cursor: isDragging && isSelected ? 'move' : 'pointer' }}
                >
                  <rect
                    x={-NODE_WIDTH / 2}
                    y={-NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={10}
                    fill={colors.bg}
                    stroke={isSelected ? colors.border : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    style={{ filter: isSelected ? `drop-shadow(0 0 8px ${colors.border}50)` : undefined }}
                  />

                  {isEditing ? (
                    <foreignObject
                      x={-NODE_WIDTH / 2 + 8}
                      y={-NODE_HEIGHT / 2 + 6}
                      width={NODE_WIDTH - 16}
                      height={NODE_HEIGHT - 12}
                    >
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={finishEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full h-full bg-transparent text-center text-sm text-white outline-none border-none"
                        style={{ color: colors.text }}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize={14}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight={node.level === 0 ? 600 : 500}
                    >
                      {node.text}
                    </text>
                  )}

                  {/* Add child button */}
                  {isSelected && !isEditing && (
                    <g
                      transform={`translate(${NODE_WIDTH / 2 + 6}, 0)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addChild(node.id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle r={12} fill="var(--primary)" />
                      <text
                        y={4}
                        textAnchor="middle"
                        fill="white"
                        fontSize={16}
                        fontWeight="bold"
                      >
                        +
                      </text>
                    </g>
                  )}

                  {/* Delete button */}
                  {isSelected && !isEditing && node.id !== rootId && (
                    <g
                      transform={`translate(${-NODE_WIDTH / 2 - 6}, ${-NODE_HEIGHT / 2})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle r={12} fill="var(--destructive)" />
                      <text y={4} textAnchor="middle" fill="white" fontSize={14}>
                        ×
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Instructions overlay */}
        <div className="absolute bottom-3 left-3 text-xs text-[var(--muted-foreground)] glass-card px-3 py-2 rounded-lg">
          双击编辑 · Tab加子节点 · Delete删除 · 滚轮缩放 · 拖拽平移
        </div>
      </div>
    </div>
  );
}
