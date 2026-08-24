'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Plus,
  Trash2,
  History,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isFullscreen?: boolean;
}

interface Option {
  id: string;
  text: string;
  color: string;
}

const RAINBOW_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#6366F1',
  '#F43F5E',
];

const DEFAULT_OPTIONS: Option[] = [
  { id: '1', text: '回答问题', color: RAINBOW_COLORS[0] },
  { id: '2', text: '上台表演', color: RAINBOW_COLORS[1] },
  { id: '3', text: '获得奖励', color: RAINBOW_COLORS[2] },
  { id: '4', text: '小组讨论', color: RAINBOW_COLORS[3] },
  { id: '5', text: '课后作业', color: RAINBOW_COLORS[4] },
  { id: '6', text: '幸运星', color: RAINBOW_COLORS[5] },
];

export default function WheelTool({ isFullscreen = false }: Props) {
  const [options, setOptions] = useState<Option[]>(DEFAULT_OPTIONS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Option | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<Option[]>([]);
  const [newOptionText, setNewOptionText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const size = isFullscreen ? 400 : 320;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wheel-options');
      if (saved) setOptions(JSON.parse(saved));
      const savedSound = localStorage.getItem('wheel-sound');
      if (savedSound) setSoundEnabled(savedSound === 'true');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wheel-options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('wheel-sound', String(soundEnabled));
  }, [soundEnabled]);

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const sliceAngle = (2 * Math.PI) / options.length;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    options.forEach((opt, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = (i + 1) * sliceAngle - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      const text = opt.text.length > 6 ? opt.text.slice(0, 6) + '…' : opt.text;
      ctx.fillText(text, radius - 20, 0);
      ctx.restore();
    });

    // Inner circle (decoration)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center icon
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', centerX, centerY);
  }, [options, size]);

  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const notes = [523, 659, 784, 1047]; // C E G C
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const spin = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // Random result
    const winnerIdx = Math.floor(Math.random() * options.length);
    const sliceAngle = 360 / options.length;
    const targetAngle =
      360 * 6 + // 6 full rotations
      (360 - (winnerIdx * sliceAngle + sliceAngle / 2)) -
      (rotation % 360);

    const finalRotation = rotation + targetAngle;

    // Tick sound during spin
    let tickCount = 0;
    const totalTicks = 30;
    const tickInterval = setInterval(() => {
      playTick();
      tickCount++;
      if (tickCount >= totalTicks) clearInterval(tickInterval);
    }, 100);

    // Animate with ease-out
    const start = rotation;
    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setRotation(start + targetAngle * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winner = options[winnerIdx];
        setResult(winner);
        setShowResult(true);
        setHistory((prev) => [winner, ...prev].slice(0, 10));
        playWinSound();
      }
    };
    requestAnimationFrame(animate);
  };

  const addOption = () => {
    if (!newOptionText.trim()) return;
    const newOpt: Option = {
      id: String(Date.now()),
      text: newOptionText.trim(),
      color: RAINBOW_COLORS[options.length % RAINBOW_COLORS.length],
    };
    setOptions([...options, newOpt]);
    setNewOptionText('');
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const fullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Confetti particles for result
  const confettiCount = 50;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="text-sm text-[var(--muted-foreground)]">
          {options.length} 个选项
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            title={soundEnabled ? '关闭音效' : '开启音效'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={fullscreenToggle}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main wheel area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Pointer */}
          <div className="relative" style={{ width: size, height: size }}>
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10"
              style={{
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '28px solid #EF4444',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            />
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ ease: 'linear' }}
              style={{ willChange: 'transform' }}
            >
              <canvas ref={canvasRef} style={{ width: size, height: size }} />
            </motion.div>
          </div>

          <button
            onClick={spin}
            disabled={isSpinning || options.length < 2}
            className="mt-8 px-10 py-4 rounded-2xl gradient-bg text-white font-bold text-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Play size={24} fill="currentColor" />
            {isSpinning ? '旋转中...' : '开始旋转'}
          </button>
        </div>

        {/* Right Panel */}
        <div className="w-64 border-l border-[var(--border)] p-4 overflow-y-auto hidden lg:block">
          <h3 className="text-sm font-semibold mb-3">选项管理</h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addOption()}
              placeholder="添加选项..."
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm"
            />
            <button
              onClick={addOption}
              className="p-2 rounded-lg gradient-bg text-white"
              title="添加"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto mb-6">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--muted)]/50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="text-sm flex-1 truncate">{opt.text}</span>
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(opt.id)}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* History */}
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <History size={14} /> 历史记录
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] py-2 text-center">
                暂无记录
              </p>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: i === 0 ? `${h.color}15` : 'transparent',
                    color: i === 0 ? h.color : 'var(--muted-foreground)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: h.color }}
                  />
                  <span className={i === 0 ? 'font-medium' : ''}>{h.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowResult(false)}
          >
            {/* Confetti */}
            {Array.from({ length: confettiCount }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  opacity: 1,
                  scale: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  ease: 'easeOut',
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)],
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card rounded-3xl p-10 max-w-sm w-full">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-sm text-[var(--muted-foreground)] mb-2">恭喜选中</p>
                <h2
                  className="text-4xl font-bold mb-6"
                  style={{ color: result.color }}
                >
                  {result.text}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResult(false)}
                    className="flex-1 py-3 rounded-xl bg-[var(--muted)] font-medium"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      setShowResult(false);
                      setTimeout(spin, 300);
                    }}
                    className="flex-1 py-3 rounded-xl gradient-bg text-white font-medium"
                  >
                    再转一次
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
