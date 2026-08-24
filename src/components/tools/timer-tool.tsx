'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Clock,
  TimerReset,
  ListOrdered,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isFullscreen?: boolean;
}

const PRESETS = [1, 3, 5, 10, 15, 30];

export default function TimerTool({ isFullscreen = false }: Props) {
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [totalSeconds, setTotalSeconds] = useState(300); // 5 minutes
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [laps, setLaps] = useState<number[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const flashRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const baseTimeRef = useRef(0);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('timer-mode');
      if (saved) setMode(saved as 'countdown' | 'stopwatch');
      const savedDuration = localStorage.getItem('timer-duration');
      if (savedDuration) {
        const secs = parseInt(savedDuration);
        setTotalSeconds(secs);
        setRemainingSeconds(secs);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('timer-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('timer-duration', String(totalSeconds));
  }, [totalSeconds]);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.4);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + i * 0.4 + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.4 + 0.3);
        oscillator.start(ctx.currentTime + i * 0.4);
        oscillator.stop(ctx.currentTime + i * 0.4 + 0.35);
      }
    } catch {
      // ignore
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      baseTimeRef.current = mode === 'countdown' ? remainingSeconds : elapsedSeconds;

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (mode === 'countdown') {
          const remaining = Math.max(0, baseTimeRef.current - elapsed);
          setRemainingSeconds(remaining);
          if (remaining === 0) {
            setIsRunning(false);
            setIsFinished(true);
            playBeep();
            // Flash effect
            let count = 0;
            const flash = () => {
              if (flashRef.current) document.body.classList.remove('!bg-red-900/30');
              else document.body.classList.add('!bg-red-900/30');
              flashRef.current = flashRef.current ? null : 1;
              count++;
              if (count < 10) setTimeout(flash, 300);
              else {
                document.body.classList.remove('!bg-red-900/30');
                flashRef.current = null;
              }
            };
            flash();
          }
        } else {
          setElapsedSeconds(baseTimeRef.current + elapsed);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeWithMs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const ms = Math.floor((Date.now() - startTimeRef.current) % 1000 / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const setPreset = (minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsFinished(false);
    setIsRunning(false);
  };

  const applyCustom = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0 && mins <= 180) {
      setPreset(mins);
      setShowCustomInput(false);
      setCustomMinutes('');
    }
  };

  const toggleStart = () => {
    if (mode === 'countdown' && remainingSeconds === 0) return;
    setIsRunning(!isRunning);
    setIsFinished(false);
  };

  const reset = () => {
    setIsRunning(false);
    setIsFinished(false);
    if (mode === 'countdown') {
      setRemainingSeconds(totalSeconds);
    } else {
      setElapsedSeconds(0);
      setLaps([]);
    }
  };

  const addLap = () => {
    if (mode === 'stopwatch' && isRunning) {
      setLaps((prev) => [elapsedSeconds, ...prev]);
    }
  };

  const switchMode = (newMode: 'countdown' | 'stopwatch') => {
    if (newMode === mode) return;
    setMode(newMode);
    setIsRunning(false);
    setIsFinished(false);
    setLaps([]);
    if (newMode === 'countdown') {
      setRemainingSeconds(totalSeconds);
    } else {
      setElapsedSeconds(0);
    }
  };

  const progress =
    mode === 'countdown'
      ? totalSeconds > 0
        ? remainingSeconds / totalSeconds
        : 1
      : 1;

  const getColor = () => {
    if (mode === 'stopwatch') return 'var(--success)';
    if (progress > 0.5) return 'var(--success)';
    if (progress > 0.2) return 'var(--warning)';
    return 'var(--destructive)';
  };

  const displaySeconds = mode === 'countdown' ? remainingSeconds : elapsedSeconds;
  const size = isFullscreen ? 320 : 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const fullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--muted)]">
          <button
            onClick={() => switchMode('countdown')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'countdown' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            倒计时
          </button>
          <button
            onClick={() => switchMode('stopwatch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'stopwatch' ? 'bg-[var(--background)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            正计时
          </button>
        </div>
        <button
          onClick={fullscreenToggle}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Circle Timer */}
        <div className="relative mb-8">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getColor()}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={mode === 'countdown' ? strokeDashoffset : 0}
              transition={{ strokeDashoffset: { duration: 0.1 }, stroke: { duration: 0.3 } }}
              style={{ filter: `drop-shadow(0 0 8px ${getColor()}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={displaySeconds + (isFinished ? 'end' : '')}
                initial={{ scale: 1 }}
                animate={{ scale: isFinished ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5 }}
                className={`font-mono font-bold tracking-tight ${
                  isFullscreen ? 'text-7xl' : 'text-6xl'
                } ${isFinished ? 'text-[var(--destructive)]' : ''}`}
                style={{ color: isFinished ? undefined : getColor() }}
              >
                {formatTime(displaySeconds)}
              </motion.div>
            </AnimatePresence>
            {isFinished && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xl font-bold text-[var(--destructive)]"
              >
                ⏰ 时间到！
              </motion.div>
            )}
            {mode === 'stopwatch' && isRunning && (
              <div className="text-sm text-[var(--muted-foreground)] mt-1 font-mono">
                {formatTimeWithMs(elapsedSeconds).split('.')[1]}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={reset}
            className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--muted)]/80 transition-colors"
            title="重置"
          >
            <RotateCcw size={22} />
          </button>
          <button
            onClick={toggleStart}
            disabled={mode === 'countdown' && remainingSeconds === 0 && !isRunning}
            className="w-20 h-20 rounded-full gradient-bg text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          {mode === 'stopwatch' ? (
            <button
              onClick={addLap}
              disabled={!isRunning}
              className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--muted)]/80 transition-colors disabled:opacity-50"
              title="计次"
            >
              <ListOrdered size={22} />
            </button>
          ) : (
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--muted)]/80 transition-colors"
              title="自定义时间"
            >
              <Clock size={22} />
            </button>
          )}
        </div>

        {/* Presets (countdown mode) */}
        {mode === 'countdown' && (
          <div className="w-full max-w-md">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => setPreset(min)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    totalSeconds === min * 60 && !isRunning
                      ? 'gradient-bg text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  } disabled:opacity-50`}
                >
                  {min}分钟
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showCustomInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                      placeholder="自定义分钟数 (1-180)"
                      className="flex-1 px-4 py-2 rounded-xl text-sm"
                      min={1}
                      max={180}
                    />
                    <button
                      onClick={applyCustom}
                      className="px-5 py-2 rounded-xl gradient-bg text-white text-sm font-medium"
                    >
                      应用
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Laps (stopwatch mode) */}
        {mode === 'stopwatch' && laps.length > 0 && (
          <div className="w-full max-w-md mt-4 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-semibold mb-2 text-[var(--muted-foreground)]">计次记录</h4>
            <div className="space-y-1">
              {laps.map((lap, i) => (
                <div
                  key={i}
                  className="flex justify-between px-3 py-2 rounded-lg text-sm bg-[var(--muted)]/50"
                >
                  <span className="text-[var(--muted-foreground)]">#{laps.length - i}</span>
                  <span className="font-mono">{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
