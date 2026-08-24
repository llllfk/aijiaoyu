'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Triangle, Weight, Gauge } from 'lucide-react';

interface DataPoint {
  time: number;
  velocity: number;
  acceleration: number;
}

export default function InclinedPlaneTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const dataRef = useRef<DataPoint[]>([]);

  const [angle, setAngle] = useState(30);
  const [mass, setMass] = useState(2);
  const [friction, setFriction] = useState(0.2);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [position, setPosition] = useState(0); // 沿斜面的位移（m）
  const [velocity, setVelocity] = useState(0);

  const g = 9.8;
  const inclineLength = 6; // 斜面长度 6m
  const blockSize = 0.6; // 木块边长 0.6m

  // 计算加速度
  const calcAcceleration = useCallback(() => {
    const theta = (angle * Math.PI) / 180;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const a = g * (sinTheta - friction * cosTheta);
    return a > 0 ? a : 0; // 若为负则静止
  }, [angle, friction]);

  const acceleration = calcAcceleration();

  // 绘制斜面和木块
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const theta = (angle * Math.PI) / 180;
    const scale = Math.min(w - 120, h - 100) / (inclineLength * 1.3);
    const baseY = h - 60;
    const baseX = 80;

    // 斜面高度
    const inclinePx = inclineLength * scale;
    const heightPx = inclinePx * Math.sin(theta);
    const widthPx = inclinePx * Math.cos(theta);

    // 斜面顶部坐标
    const topX = baseX;
    const topY = baseY - heightPx;
    const bottomX = baseX + widthPx;
    const bottomY = baseY;

    // 地面
    const groundGradient = ctx.createLinearGradient(0, baseY, 0, h);
    groundGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    groundGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, baseY, w, h - baseY);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();

    // 斜面三角形
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(bottomX, bottomY);
    ctx.lineTo(topX, topY);
    ctx.closePath();

    const slopeGradient = ctx.createLinearGradient(topX, topY, bottomX, bottomY);
    slopeGradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    slopeGradient.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
    ctx.fillStyle = slopeGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 斜面斜线加粗
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(bottomX, bottomY);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 角度弧
    ctx.beginPath();
    ctx.arc(baseX, baseY, 50, -theta, 0, false);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 角度标注
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 14px Inter, system-ui';
    ctx.fillText(`${angle}°`, baseX + 55, baseY - 8);

    // 高度虚线标注
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 木块位置计算
    const s = Math.min(position, inclineLength - blockSize);
    const blockCenterX = topX + (s + blockSize / 2) * scale * Math.cos(theta);
    const blockCenterY = topY + (s + blockSize / 2) * scale * Math.sin(theta);

    // 绘制木块（正方形，垂直斜面方向）
    const bs = (blockSize * scale) / 2;
    const perpX = -Math.sin(theta) * bs;
    const perpY = -Math.cos(theta) * bs;
    const paraX = Math.cos(theta) * bs;
    const paraY = Math.sin(theta) * bs;

    ctx.beginPath();
    ctx.moveTo(blockCenterX - paraX + perpX, blockCenterY - paraY + perpY);
    ctx.lineTo(blockCenterX + paraX + perpX, blockCenterY + paraY + perpY);
    ctx.lineTo(blockCenterX + paraX - perpX, blockCenterY + paraY - perpY);
    ctx.lineTo(blockCenterX - paraX - perpX, blockCenterY - paraY - perpY);
    ctx.closePath();

    const blockGradient = ctx.createLinearGradient(
      blockCenterX - paraX,
      blockCenterY - paraY,
      blockCenterX + paraX,
      blockCenterY + paraY
    );
    blockGradient.addColorStop(0, '#6366F1');
    blockGradient.addColorStop(1, '#3B82F6');
    ctx.fillStyle = blockGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 重力箭头
    if (isRunning || isPaused) {
      const arrowLen = 30;
      const arrowX = blockCenterX;
      const arrowY = blockCenterY;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX, arrowY + arrowLen);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 箭头头部
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + arrowLen);
      ctx.lineTo(arrowX - 5, arrowY + arrowLen - 6);
      ctx.lineTo(arrowX + 5, arrowY + arrowLen - 6);
      ctx.closePath();
      ctx.fillStyle = '#EF4444';
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.font = '12px Inter';
      ctx.fillText('mg', arrowX + 8, arrowY + arrowLen - 4);
    }
  }, [angle, position, isRunning, isPaused, blockSize, inclineLength]);

  // 绘制数据曲线
  const drawChart = useCallback(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const data = dataRef.current;
    if (data.length < 2) {
      // 空状态提示
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '13px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('点击"开始"查看实时曲线', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    // 计算范围
    const maxTime = Math.max(time, 5);
    const maxV = Math.max(...data.map(d => d.velocity), 10);
    const maxA = Math.max(...data.map(d => d.acceleration), 5);

    // 网格线
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    // 速度曲线
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (data[i].time / maxTime) * chartW;
      const y = padding.top + chartH - (data[i].velocity / maxV) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 加速度曲线
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (data[i].time / maxTime) * chartW;
      const y = padding.top + chartH - (data[i].acceleration / maxA) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // X轴标签
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartW * i) / 5;
      const val = ((maxTime * i) / 5).toFixed(1);
      ctx.fillText(val + 's', x, padding.top + chartH + 16);
    }
    ctx.textAlign = 'left';

    // Y轴标签（速度）
    ctx.fillStyle = '#3B82F6';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + chartH - (chartH * i) / 5;
      const val = ((maxV * i) / 5).toFixed(1);
      ctx.fillText(val + '', padding.left - 6, y + 4);
    }
    ctx.textAlign = 'left';

    // 图例
    ctx.font = '12px Inter';
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(padding.left, padding.top - 14, 12, 4);
    ctx.fillStyle = 'rgba(232, 236, 244, 0.9)';
    ctx.fillText('速度 v (m/s)', padding.left + 18, padding.top - 8);

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(padding.left + 130, padding.top - 14, 12, 4);
    ctx.fillStyle = 'rgba(232, 236, 244, 0.9)';
    ctx.fillText('加速度 a (m/s²)', padding.left + 148, padding.top - 8);
  }, [time]);

  // 动画循环
  const animate = useCallback((timestamp: number) => {
    if (!isRunning || isPaused) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
    }
    const elapsed = (timestamp - startTimeRef.current) / 1000;

    const a = calcAcceleration();
    const v = velocity + a * (elapsed - time);
    const s = position + velocity * (elapsed - time) + 0.5 * a * (elapsed - time) ** 2;

    // 检查是否到达底部
    if (s >= inclineLength - blockSize) {
      setPosition(inclineLength - blockSize);
      setVelocity(0);
      setTime(elapsed);
      dataRef.current.push({ time: elapsed, velocity: 0, acceleration: 0 });
      setIsRunning(false);
      setIsPaused(false);
      drawScene();
      drawChart();
      return;
    }

    setTime(elapsed);
    setPosition(s);
    setVelocity(v);

    // 添加数据点（每100ms左右加一个点）
    if (dataRef.current.length === 0 || elapsed - dataRef.current[dataRef.current.length - 1].time >= 0.05) {
      dataRef.current.push({ time: elapsed, velocity: v, acceleration: a });
      if (dataRef.current.length > 500) {
        dataRef.current.shift();
      }
    }

    drawScene();
    drawChart();

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, isPaused, velocity, position, time, calcAcceleration, drawScene, drawChart, inclineLength, blockSize]);

  // 启动/暂停动画
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = 0; // 重置
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused, animate]);

  // 参数变化时重绘
  useEffect(() => {
    drawScene();
    drawChart();
  }, [drawScene, drawChart]);

  // 响应式canvas
  useEffect(() => {
    const handleResize = () => {
      const sceneCanvas = canvasRef.current;
      const chartCanvas = chartCanvasRef.current;
      if (sceneCanvas) {
        const parent = sceneCanvas.parentElement;
        if (parent) {
          sceneCanvas.width = parent.clientWidth;
          sceneCanvas.height = parent.clientHeight;
        }
      }
      if (chartCanvas) {
        const parent = chartCanvas.parentElement;
        if (parent) {
          chartCanvas.width = parent.clientWidth;
          chartCanvas.height = parent.clientHeight;
        }
      }
      drawScene();
      drawChart();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawScene, drawChart]);

  const handleStart = () => {
    if (acceleration === 0) return; // 静止，不启动
    if (position >= inclineLength - blockSize) {
      // 已经到底了，重置再开始
      setPosition(0);
      setVelocity(0);
      setTime(0);
      dataRef.current = [];
    }
    dataRef.current = [{ time: 0, velocity: velocity, acceleration: acceleration }];
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setPosition(0);
    setVelocity(0);
    setTime(0);
    dataRef.current = [];
    startTimeRef.current = 0;
  };

  // 角度变化时如果在运行中，重置（避免物理不一致）
  useEffect(() => {
    if (isRunning) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, mass, friction]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左侧控制面板 */}
      <div className="lg:col-span-3 space-y-5">
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-[#E8ECF4] mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            参数控制
          </h3>

          <div className="space-y-6">
            {/* 斜面角度 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[#8892A4] flex items-center gap-2">
                  <Triangle className="w-4 h-4" />
                  斜面角度
                </label>
                <span className="text-sm font-semibold text-blue-400">{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
                  [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-indigo-500
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-blue-500/30"
              />
            </div>

            {/* 木块质量 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[#8892A4] flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  木块质量
                </label>
                <span className="text-sm font-semibold text-blue-400">{mass.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
                  [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-indigo-500
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-blue-500/30"
              />
            </div>

            {/* 摩擦系数 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[#8892A4] flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  摩擦系数 μ
                </label>
                <span className="text-sm font-semibold text-blue-400">{friction.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={friction}
                onChange={(e) => setFriction(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br
                  [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-indigo-500
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-blue-500/30"
              />
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-3 mt-6">
            {!isRunning || isPaused ? (
              <button
                onClick={handleStart}
                disabled={acceleration === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4
                  bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl
                  font-medium hover:from-blue-600 hover:to-indigo-600 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20
                  active:scale-[0.98]"
              >
                <Play className="w-5 h-5" />
                开始
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4
                  bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl
                  font-medium hover:bg-amber-500/30 transition-all active:scale-[0.98]"
              >
                <Pause className="w-5 h-5" />
                暂停
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-3 px-4
                bg-white/5 text-[#8892A4] border border-white/10 rounded-xl
                font-medium hover:bg-white/10 hover:text-[#E8ECF4] transition-all
                active:scale-[0.98]"
              title="重置"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 实时数据 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-[#E8ECF4] mb-4">实时数据</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-[#8892A4]">时间</span>
              <span className="text-lg font-semibold text-[#E8ECF4] font-mono">{time.toFixed(2)} s</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-[#8892A4]">位移</span>
              <span className="text-lg font-semibold text-blue-400 font-mono">{position.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm text-[#8892A4]">速度</span>
              <span className="text-lg font-semibold text-cyan-400 font-mono">{velocity.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#8892A4]">加速度</span>
              <span className="text-lg font-semibold text-amber-400 font-mono">{acceleration.toFixed(2)} m/s²</span>
            </div>
          </div>
          {acceleration === 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-400">
                ⚡ 摩擦力大于下滑力，木块保持静止。请增大斜面角度或减小摩擦系数。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 中间动画 + 右侧曲线 */}
      <div className="lg:col-span-9 space-y-6">
        {/* 动画区域 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#E8ECF4]">斜面实验</h3>
            <span className="text-xs text-[#8892A4]">g = 9.8 m/s²</span>
          </div>
          <div className="h-[380px] w-full">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* 数据曲线 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-lg font-semibold text-[#E8ECF4]">运动曲线</h3>
          </div>
          <div className="h-[260px] w-full p-4">
            <canvas ref={chartCanvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
