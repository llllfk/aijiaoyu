'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, RotateCcw, ZoomIn, Move } from 'lucide-react';
import { evaluate } from 'mathjs';

interface Props {
  isFullscreen?: boolean;
}

interface FuncDef {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
}

interface Point {
  x: number;
  y: number;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#06B6D4'];

const DEFAULT_FUNCTIONS: FuncDef[] = [
  { id: '1', expression: 'sin(x)', color: COLORS[0], visible: true },
  { id: '2', expression: 'x^2', color: COLORS[1], visible: false },
  { id: '3', expression: '', color: COLORS[2], visible: false },
];

export default function FunctionPlotterTool({ isFullscreen = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [functions, setFunctions] = useState<FuncDef[]>(DEFAULT_FUNCTIONS);
  const [params, setParams] = useState<Record<string, number>>({});
  const [view, setView] = useState({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, view: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 } });
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; funcIdx: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });

  // Detect parameters from expressions
  useEffect(() => {
    const detected: Record<string, number> = {};
    const paramRegex = /\b([a-wyzA-WYZ])\b/g;
    functions.forEach((f) => {
      if (!f.expression.trim()) return;
      const expr = f.expression.replace(/\b(sin|cos|tan|log|ln|sqrt|abs|pow|exp|pi|e|x)\b/gi, '');
      const matches = expr.match(paramRegex) || [];
      matches.forEach((p) => {
        if (!(p in detected)) detected[p] = 1;
      });
    });
    setParams(detected);
  }, [functions.map((f) => f.expression).join('|')]);

  // Resize observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ w: Math.floor(rect.width), h: isFullscreen ? window.innerHeight - 64 : 400 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isFullscreen]);

  // Coordinate conversion
  const toCanvasX = useCallback(
    (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * canvasSize.w,
    [view, canvasSize.w]
  );
  const toCanvasY = useCallback(
    (y: number) => ((view.yMax - y) / (view.yMax - view.yMin)) * canvasSize.h,
    [view, canvasSize.h]
  );
  const fromCanvasX = useCallback(
    (cx: number) => view.xMin + (cx / canvasSize.w) * (view.xMax - view.xMin),
    [view, canvasSize.w]
  );
  const fromCanvasY = useCallback(
    (cy: number) => view.yMax - (cy / canvasSize.h) * (view.yMax - view.yMin),
    [view, canvasSize.h]
  );

  // Evaluate function
  const evalFunc = useCallback(
    (expr: string, x: number): number | null => {
      if (!expr.trim()) return null;
      try {
        const scope: Record<string, number> = { x, pi: Math.PI, e: Math.E, ...params };
        let processed = expr
          .replace(/\bln\(/g, 'log(')
          .replace(/\^/g, '^');
        const result = evaluate(processed, scope);
        if (typeof result === 'number' && isFinite(result)) return result;
        return null;
      } catch {
        return null;
      }
    },
    [params]
  );

  // Find zeros and extrema
  const findKeyPoints = useCallback(
    (expr: string): { zeros: Point[]; extrema: Point[] } => {
      const zeros: Point[] = [];
      const extrema: Point[] = [];
      const step = (view.xMax - view.xMin) / canvasSize.w;
      let prevY: number | null = null;
      let prevX = 0;
      let prevSlope = 0;

      for (let px = 0; px <= canvasSize.w; px++) {
        const x = fromCanvasX(px);
        const y = evalFunc(expr, x);

        if (y !== null && prevY !== null) {
          // Zero crossing
          if (prevY * y < 0) {
            // Linear interpolation
            const t = Math.abs(prevY) / (Math.abs(prevY) + Math.abs(y));
            const zeroX = prevX + t * (x - prevX);
            zeros.push({ x: zeroX, y: 0 });
          }

          // Extrema (slope change)
          const slope = y - prevY;
          if (prevSlope * slope < 0 && Math.abs(slope) < 1) {
            extrema.push({ x: (prevX + x) / 2, y: (prevY + y) / 2 });
          }
          prevSlope = slope;
        }

        prevY = y;
        prevX = x;
      }

      return { zeros, extrema };
    },
    [evalFunc, fromCanvasX, canvasSize.w, view.xMax, view.xMin]
  );

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    // Draw grid
    const xRange = view.xMax - view.xMin;
    const yRange = view.yMax - view.yMin;

    // Choose grid step
    const xStep = chooseGridStep(xRange / 10);
    const yStep = chooseGridStep(yRange / 8);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = Math.ceil(view.xMin / xStep) * xStep; x <= view.xMax; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvasSize.h);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(view.yMin / yStep) * yStep; y <= view.yMax; y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvasSize.w, cy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.5;

    // X axis
    if (view.yMin <= 0 && view.yMax >= 0) {
      const y0 = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(canvasSize.w, y0);
      ctx.stroke();

      // X axis labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let x = Math.ceil(view.xMin / xStep) * xStep; x <= view.xMax; x += xStep) {
        if (Math.abs(x) < 0.001) continue;
        const cx = toCanvasX(x);
        ctx.fillText(formatNum(x), cx, y0 + 4);
      }
    }

    // Y axis
    if (view.xMin <= 0 && view.xMax >= 0) {
      const x0 = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, canvasSize.h);
      ctx.stroke();

      // Y axis labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = Math.ceil(view.yMin / yStep) * yStep; y <= view.yMax; y += yStep) {
        if (Math.abs(y) < 0.001) continue;
        const cy = toCanvasY(y);
        ctx.fillText(formatNum(y), toCanvasX(0) - 6, cy);
      }
    }

    // Origin label
    if (view.xMin <= 0 && view.xMax >= 0 && view.yMin <= 0 && view.yMax >= 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('O', toCanvasX(0) - 6, toCanvasY(0) + 4);
    }

    // Draw functions
    functions.forEach((func) => {
      if (!func.visible || !func.expression.trim()) return;

      ctx.strokeStyle = func.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let started = false;
      let prevValid = false;

      for (let px = 0; px <= canvasSize.w; px++) {
        const x = fromCanvasX(px);
        const y = evalFunc(func.expression, x);
        const cy = y !== null ? toCanvasY(y) : null;

        if (y !== null && cy !== null && isFinite(cy) && cy >= -1000 && cy <= canvasSize.h + 1000) {
          if (!started) {
            ctx.moveTo(px, cy);
            started = true;
          } else if (prevValid) {
            // Check for discontinuity (big jump)
            const prevCy = toCanvasY(evalFunc(func.expression, fromCanvasX(px - 1))!);
            if (Math.abs(cy - prevCy) > canvasSize.h * 0.5) {
              ctx.moveTo(px, cy);
            } else {
              ctx.lineTo(px, cy);
            }
          }
          prevValid = true;
        } else {
          prevValid = false;
          started = false;
        }
      }
      ctx.stroke();

      // Draw key points
      const { zeros, extrema } = findKeyPoints(func.expression);

      // Zeros (green dots)
      ctx.fillStyle = '#10B981';
      zeros.forEach((p) => {
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(0);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Extrema (orange dots)
      ctx.fillStyle = '#F59E0B';
      extrema.forEach((p) => {
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(p.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Hover point
    if (hoverPoint) {
      const func = functions[hoverPoint.funcIdx];
      if (func && func.visible) {
        const cx = toCanvasX(hoverPoint.x);
        const cy = toCanvasY(hoverPoint.y);
        ctx.fillStyle = func.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [functions, view, canvasSize, toCanvasX, toCanvasY, fromCanvasX, evalFunc, findKeyPoints, hoverPoint]);

  function chooseGridStep(approx: number): number {
    const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
    let best = steps[0];
    for (const s of steps) {
      if (Math.abs(s - approx) < Math.abs(best - approx)) best = s;
    }
    return best;
  }

  function formatNum(n: number): string {
    if (Math.abs(n) < 0.001) return '0';
    if (Math.abs(n) >= 1000) return n.toFixed(0);
    if (Math.abs(n) >= 1) return n.toFixed(1);
    return n.toFixed(1);
  }

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = fromCanvasX(mx);
    const worldY = fromCanvasY(my);

    setView((prev) => {
      const newXMin = worldX - (worldX - prev.xMin) * factor;
      const newXMax = worldX + (prev.xMax - worldX) * factor;
      const newYMin = worldY - (worldY - prev.yMin) * factor;
      const newYMax = worldY + (prev.yMax - worldY) * factor;
      return { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    });
  };

  // Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, view: { ...view } };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const worldDx = (dx / canvasSize.w) * (dragStart.current.view.xMax - dragStart.current.view.xMin);
      const worldDy = (dy / canvasSize.h) * (dragStart.current.view.yMax - dragStart.current.view.yMin);
      setView({
        xMin: dragStart.current.view.xMin - worldDx,
        xMax: dragStart.current.view.xMax - worldDx,
        yMin: dragStart.current.view.yMin + worldDy,
        yMax: dragStart.current.view.yMax + worldDy,
      });
    } else {
      // Hover detection
      const mx = e.clientX - rect.left;
      const wx = fromCanvasX(mx);
      let closest: { x: number; y: number; funcIdx: number; dist: number } | null = null;

      functions.forEach((func, idx) => {
        if (!func.visible || !func.expression.trim()) return;
        const y = evalFunc(func.expression, wx);
        if (y !== null) {
          const cy = toCanvasY(y);
          const dist = Math.abs(cy - (e.clientY - rect.top));
          if (dist < 15 && (!closest || dist < closest.dist)) {
            closest = { x: wx, y, funcIdx: idx, dist };
          }
        }
      });

      setHoverPoint(closest ? { x: (closest as any).x, y: (closest as any).y, funcIdx: (closest as any).funcIdx } : null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const touchStart = useRef<{ x: number; y: number; pinchDist?: number; view?: typeof view }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, view: { ...view } };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStart.current = { x: 0, y: 0, pinchDist: Math.sqrt(dx * dx + dy * dy), view: { ...view } };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging && touchStart.current.view) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      const worldDx = (dx / canvasSize.w) * (touchStart.current.view.xMax - touchStart.current.view.xMin);
      const worldDy = (dy / canvasSize.h) * (touchStart.current.view.yMax - touchStart.current.view.yMin);
      setView({
        xMin: touchStart.current.view.xMin - worldDx,
        xMax: touchStart.current.view.xMax - worldDx,
        yMin: touchStart.current.view.yMin + worldDy,
        yMax: touchStart.current.view.yMax + worldDy,
      });
    } else if (e.touches.length === 2 && touchStart.current.pinchDist && touchStart.current.view) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = touchStart.current.pinchDist / dist;
      const v = touchStart.current.view;
      const cx = (v.xMin + v.xMax) / 2;
      const cy = (v.yMin + v.yMax) / 2;
      const hw = ((v.xMax - v.xMin) / 2) * factor;
      const hh = ((v.yMax - v.yMin) / 2) * factor;
      setView({ xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setView({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
  };

  const updateFunc = (id: string, field: keyof FuncDef, value: any) => {
    setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const addFunction = () => {
    if (functions.length >= 5) return;
    const newId = String(Date.now());
    setFunctions((prev) => [
      ...prev,
      {
        id: newId,
        expression: '',
        color: COLORS[prev.length % COLORS.length],
        visible: true,
      },
    ]);
  };

  const removeFunc = (id: string) => {
    if (functions.length <= 1) return;
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  const paramEntries = Object.entries(params);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">函数图像绘制器</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            title="重置视图"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 p-4 border-r border-[var(--border)] overflow-y-auto hidden md:block">
          <h3 className="text-sm font-semibold mb-3">函数表达式</h3>
          <div className="space-y-2 mb-4">
            {functions.map((func, idx) => (
              <div key={func.id} className="flex items-center gap-2">
                <button
                  onClick={() => updateFunc(func.id, 'visible', !func.visible)}
                  className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: func.color,
                    backgroundColor: func.visible ? func.color : 'transparent',
                  }}
                >
                  {func.visible && <span className="text-white text-xs">✓</span>}
                </button>
                <span className="text-sm text-[var(--muted-foreground)] flex-shrink-0">y=</span>
                <input
                  type="text"
                  value={func.expression}
                  onChange={(e) => updateFunc(func.id, 'expression', e.target.value)}
                  placeholder={`函数 ${idx + 1}`}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm"
                />
                {functions.length > 1 && (
                  <button
                    onClick={() => removeFunc(func.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {functions.length < 5 && (
            <button
              onClick={addFunction}
              className="w-full py-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={14} /> 添加函数
            </button>
          )}

          {/* Parameters */}
          {paramEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">参数调节</h3>
              <div className="space-y-3">
                {paramEntries.map(([name, value]) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono font-medium">{name}</span>
                      <span className="text-[var(--muted-foreground)]">{value.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={-5}
                      max={5}
                      step={0.1}
                      value={value}
                      onChange={(e) =>
                        setParams((prev) => ({ ...prev, [name]: parseFloat(e.target.value) }))
                      }
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">图例</h3>
            <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> 零点 (y=0)
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> 极值点
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: canvasSize.w, height: canvasSize.h }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Hover tooltip */}
          {hoverPoint && (
            <div
              className="absolute pointer-events-none px-2 py-1 rounded-md text-xs font-mono glass-card"
              style={{
                left: Math.min(toCanvasX(hoverPoint.x) + 10, canvasSize.w - 100),
                top: Math.min(toCanvasY(hoverPoint.y) + 10, canvasSize.h - 30),
              }}
            >
              ({hoverPoint.x.toFixed(2)}, {hoverPoint.y.toFixed(2)})
            </div>
          )}

          {/* Zoom hint (mobile) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] glass-card px-2 py-1 rounded-lg">
            <ZoomIn size={12} /> 滚轮缩放
            <Move size={12} className="ml-1" /> 拖拽平移
          </div>
        </div>
      </div>

      {/* Mobile function panel */}
      <div className="md:hidden p-4 border-t border-[var(--border)]">
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">函数设置 ({functions.filter(f => f.visible && f.expression).length} 个)</summary>
          <div className="mt-3 space-y-2">
            {functions.map((func, idx) => (
              <div key={func.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={func.expression}
                  onChange={(e) => updateFunc(func.id, 'expression', e.target.value)}
                  placeholder={`y = 函数 ${idx + 1}`}
                  className="flex-1 px-2 py-1.5 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
