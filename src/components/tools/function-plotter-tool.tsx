'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluate, parse } from 'mathjs';
import { Plus, Trash2, ZoomIn, ZoomOut, Move, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunctionItem {
  id: number;
  expression: string;
  color: string;
  visible: boolean;
  hasA: boolean;
  hasB: boolean;
}

const COLORS = ['#4F46E5', '#F59E0B', '#10B981'];
const MAX_FUNCTIONS = 3;

export function FunctionPlotterTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: 1, expression: 'x^2', color: COLORS[0], visible: true, hasA: false, hasB: false },
  ]);
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(0);
  const [scale, setScale] = useState(40); // 每单位像素数
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  // 检测表达式是否包含参数 a 或 b
  const detectParams = useCallback((expr: string) => {
    const lower = expr.toLowerCase();
    return {
      hasA: /\ba\b/.test(lower) && !lower.includes('abs'),
      hasB: /\bb\b/.test(lower),
    };
  }, []);

  // 计算函数值
  const evaluateFunction = useCallback(
    (expr: string, x: number): number | null => {
      try {
        const result = evaluate(expr, { x, a: paramA, b: paramB, pi: Math.PI, e: Math.E });
        if (typeof result === 'number' && isFinite(result)) {
          return result;
        }
        return null;
      } catch {
        return null;
      }
    },
    [paramA, paramB],
  );

  // 找零点（简单的二分法）
  const findZeros = useCallback(
    (expr: string, xMin: number, xMax: number, steps: number): number[] => {
      const zeros: number[] = [];
      const step = (xMax - xMin) / steps;

      let prevY = evaluateFunction(expr, xMin);
      if (prevY === null) return zeros;

      for (let i = 1; i <= steps; i++) {
        const x = xMin + i * step;
        const y = evaluateFunction(expr, x);
        if (y === null) {
          prevY = null;
          continue;
        }
        if (prevY !== null && prevY * y < 0) {
          // 二分法精确找零点
          let left = x - step;
          let right = x;
          for (let j = 0; j < 20; j++) {
            const mid = (left + right) / 2;
            const midY = evaluateFunction(expr, mid);
            if (midY === null) break;
            const leftY = evaluateFunction(expr, left);
            if (leftY === null) break;
            if (leftY * midY < 0) {
              right = mid;
            } else {
              left = mid;
            }
          }
          zeros.push((left + right) / 2);
        }
        prevY = y;
      }

      return zeros;
    },
    [evaluateFunction],
  );

  // 绘制图像
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;

    // 计算网格间距
    let gridStep = 1;
    if (scale < 20) gridStep = 2;
    if (scale < 10) gridStep = 5;
    if (scale < 5) gridStep = 10;
    if (scale > 80) gridStep = 0.5;
    if (scale > 160) gridStep = 0.2;

    const pixelStep = gridStep * scale;

    // 垂直网格线
    const startX = centerX % pixelStep;
    for (let x = startX; x < width; x += pixelStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 水平网格线
    const startY = centerY % pixelStep;
    for (let y = startY; y < height; y += pixelStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制坐标轴
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X轴
    if (centerY >= 0 && centerY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // X轴箭头
      ctx.beginPath();
      ctx.moveTo(width - 10, centerY - 6);
      ctx.lineTo(width, centerY);
      ctx.lineTo(width - 10, centerY + 6);
      ctx.stroke();
    }

    // Y轴
    if (centerX >= 0 && centerX <= width) {
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Y轴箭头
      ctx.beginPath();
      ctx.moveTo(centerX - 6, 10);
      ctx.lineTo(centerX, 0);
      ctx.lineTo(centerX + 6, 10);
      ctx.stroke();
    }

    // 绘制刻度和数字
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X轴刻度
    const xMin = (-centerX) / scale;
    const xMax = (width - centerX) / scale;
    for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) {
      const px = centerX + x * scale;
      if (Math.abs(x) < 0.001) continue; // 跳过原点

      // 刻度线
      ctx.beginPath();
      ctx.moveTo(px, centerY - 4);
      ctx.lineTo(px, centerY + 4);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 数字
      const displayX = Math.abs(x) < 0.01 ? x.toFixed(2) : Math.abs(x) < 1 ? x.toFixed(1) : x.toFixed(0);
      ctx.fillText(displayX, px, centerY + 8);
    }

    // Y轴刻度
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yMin = (height - centerY) / scale;
    const yMax = centerY / scale;
    for (let y = Math.ceil(yMin / gridStep) * gridStep; y <= yMax; y += gridStep) {
      const py = centerY - y * scale;
      if (Math.abs(y) < 0.001) continue;

      // 刻度线
      ctx.beginPath();
      ctx.moveTo(centerX - 4, py);
      ctx.lineTo(centerX + 4, py);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 数字
      const displayY = Math.abs(y) < 0.01 ? y.toFixed(2) : Math.abs(y) < 1 ? y.toFixed(1) : y.toFixed(0);
      ctx.fillText(displayY, centerX - 8, py);
    }

    // 原点标注
    if (centerX >= 0 && centerX <= width && centerY >= 0 && centerY <= height) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('O', centerX - 8, centerY + 8);
    }

    // 绘制函数曲线
    functions.forEach((func) => {
      if (!func.visible || !func.expression.trim()) return;

      // 先验证表达式
      try {
        parse(func.expression.replace(/^y\s*=\s*/i, ''));
      } catch {
        return;
      }

      const expr = func.expression.replace(/^y\s*=\s*/i, '');

      ctx.strokeStyle = func.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      let isFirst = true;
      let prevY: number | null = null;

      for (let px = 0; px < width; px += 0.5) {
        const x = (px - centerX) / scale;
        const y = evaluateFunction(expr, x);

        if (y !== null) {
          const py = centerY - y * scale;

          // 检查是否超出画布范围太大（避免绘制无穷远点）
          if (py < -10000 || py > height + 10000) {
            isFirst = true;
            prevY = null;
            continue;
          }

          // 检测间断点（突变）
          if (prevY !== null && Math.abs(y - prevY) > 1000 / scale) {
            isFirst = true;
          }

          if (isFirst) {
            ctx.moveTo(px, py);
            isFirst = false;
          } else {
            ctx.lineTo(px, py);
          }

          prevY = y;
        } else {
          isFirst = true;
          prevY = null;
        }
      }

      ctx.stroke();

      // 绘制零点
      const zeros = findZeros(expr, xMin, xMax, 500);
      zeros.forEach((zeroX) => {
        const px = centerX + zeroX * scale;
        const py = centerY;

        ctx.fillStyle = func.color;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    setError(null);
  }, [functions, scale, offset, evaluateFunction, findZeros]);

  // 初始化canvas尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // 绘制
  useEffect(() => {
    draw();
  }, [draw]);

  // 鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(5, Math.min(500, scale * delta));
      setScale(newScale);
    },
    [scale],
  );

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸事件
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const ratio = distance / touchStartRef.current.distance;
      const newScale = Math.max(5, Math.min(500, scale * ratio));
      setScale(newScale);
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  // 添加函数
  const addFunction = () => {
    if (functions.length >= MAX_FUNCTIONS) return;
    const newId = Math.max(...functions.map((f) => f.id), 0) + 1;
    setFunctions([
      ...functions,
      {
        id: newId,
        expression: '',
        color: COLORS[functions.length % COLORS.length],
        visible: true,
        hasA: false,
        hasB: false,
      },
    ]);
  };

  // 删除函数
  const removeFunction = (id: number) => {
    if (functions.length <= 1) return;
    setFunctions(functions.filter((f) => f.id !== id));
  };

  // 更新函数表达式
  const updateExpression = (id: number, expression: string) => {
    setFunctions(
      functions.map((f) => {
        if (f.id === id) {
          const { hasA, hasB } = detectParams(expression);
          // 验证表达式
          try {
            const expr = expression.replace(/^y\s*=\s*/i, '');
            if (expr.trim()) {
              parse(expr);
            }
            setError(null);
          } catch (err) {
            setError(`表达式错误: ${(err as Error).message}`);
          }
          return { ...f, expression, hasA, hasB };
        }
        return f;
      }),
    );
  };

  // 切换可见性
  const toggleVisible = (id: number) => {
    setFunctions(
      functions.map((f) =>
        f.id === id ? { ...f, visible: !f.visible } : f,
      ),
    );
  };

  // 重置视图
  const resetView = () => {
    setScale(40);
    setOffset({ x: 0, y: 0 });
  };

  // 缩放
  const zoomIn = () => setScale((s) => Math.min(500, s * 1.3));
  const zoomOut = () => setScale((s) => Math.max(5, s / 1.3));

  const hasParamA = functions.some((f) => f.hasA);
  const hasParamB = functions.some((f) => f.hasB);

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px]">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="放大"
            >
              <ZoomIn className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="重置视图"
            >
              <RotateCcw className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-500">
              <Move className="w-4 h-4" />
              <span>拖拽平移 · 滚轮缩放</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">缩放: {(scale / 40 * 100).toFixed(0)}%</div>
        </div>

        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 min-h-[400px] relative bg-white">
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={cn(
              'w-full h-full touch-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
          />

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Parameter Sliders */}
        {(hasParamA || hasParamB) && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {hasParamA && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 w-16">
                  a = {paramA.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={paramA}
                  onChange={(e) => setParamA(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
            {hasParamB && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 w-16">
                  b = {paramB.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={paramB}
                  onChange={(e) => setParamB(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side Panel */}
      <div className="lg:w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="p-4 lg:p-6 flex-1">
          <h3 className="font-semibold text-gray-900 mb-4">函数表达式</h3>

          <div className="space-y-3 mb-4">
            {functions.map((func, index) => (
              <div key={func.id} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: func.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    y{index + 1}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => toggleVisible(func.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={func.visible ? '隐藏' : '显示'}
                  >
                    {func.visible ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {functions.length > 1 && (
                    <button
                      onClick={() => removeFunction(func.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-mono">y =</span>
                  <input
                    type="text"
                    value={func.expression}
                    onChange={(e) => updateExpression(func.id, e.target.value)}
                    placeholder="如 x^2, sin(x), 2x+1"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {functions.length < MAX_FUNCTIONS && (
            <button
              onClick={addFunction}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-dashed border-gray-300 hover:border-indigo-400 hover:text-indigo-600 rounded-xl text-sm text-gray-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加函数 ({functions.length}/{MAX_FUNCTIONS})
            </button>
          )}

          {/* Help */}
          <div className="mt-6 p-4 bg-white rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2">支持的运算</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">+ - * / ^</span>{' '}
                基本运算
              </p>
              <p>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  sin cos tan
                </span>{' '}
                三角函数
              </p>
              <p>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  log sqrt abs
                </span>{' '}
                其他函数
              </p>
              <p>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">pi e</span>{' '}
                常量
              </p>
              <p>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">a b</span>{' '}
                可调参数
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
