'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer as TimerIcon,
  Clock,
  Flag,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TimerMode = 'countdown' | 'stopwatch';

interface LapRecord {
  index: number;
  time: number;
  totalTime: number;
}

export function TimerTool() {
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 秒
  const [totalTime, setTotalTime] = useState(300); // 倒计时总时间
  const [inputMinutes, setInputMinutes] = useState(5);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laps, setLaps] = useState<LapRecord[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const baseTimeRef = useRef<number>(0);

  const presetTimes = [
    { label: '1分钟', seconds: 60 },
    { label: '3分钟', seconds: 180 },
    { label: '5分钟', seconds: 300 },
    { label: '10分钟', seconds: 600 },
    { label: '15分钟', seconds: 900 },
  ];

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算颜色 - 倒计时模式下根据剩余时间比例
  const getTimeColor = (): string => {
    if (mode === 'stopwatch') return 'text-white';
    const ratio = currentTime / totalTime;
    if (ratio > 0.5) return 'text-emerald-400';
    if (ratio > 0.2) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (): string => {
    if (mode === 'stopwatch') return '#34d399';
    const ratio = currentTime / totalTime;
    if (ratio > 0.5) return '#34d399';
    if (ratio > 0.2) return '#fbbf24';
    return '#f87171';
  };

  // 开始/暂停
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      // 暂停
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
    } else {
      // 开始
      if (mode === 'countdown' && currentTime <= 0) return;

      baseTimeRef.current = currentTime;
      startTimeRef.current = Date.now();
      setIsFinished(false);
      setIsRunning(true);
    }
  }, [isRunning, mode, currentTime]);

  // 重置
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsFinished(false);
    setLaps([]);

    if (mode === 'countdown') {
      setCurrentTime(totalTime);
    } else {
      setCurrentTime(0);
    }
  }, [mode, totalTime]);

  // 计次
  const addLap = useCallback(() => {
    if (mode === 'stopwatch' && isRunning) {
      const lastLapTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
      setLaps((prev) => [
        {
          index: prev.length + 1,
          time: currentTime - lastLapTime,
          totalTime: currentTime,
        },
        ...prev,
      ]);
    }
  }, [mode, isRunning, currentTime, laps]);

  // 切换模式
  const switchMode = useCallback(
    (newMode: TimerMode) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      setIsFinished(false);
      setLaps([]);
      setMode(newMode);
      if (newMode === 'countdown') {
        setCurrentTime(totalTime);
      } else {
        setCurrentTime(0);
      }
    },
    [totalTime],
  );

  // 设置倒计时时间
  const setCountdownTime = useCallback((seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsFinished(false);
    setTotalTime(seconds);
    setCurrentTime(seconds);
    setInputMinutes(Math.floor(seconds / 60));
    setInputSeconds(seconds % 60);
  }, []);

  // 手动设置时间
  const applyManualTime = useCallback(() => {
    const seconds = inputMinutes * 60 + inputSeconds;
    if (seconds > 0) {
      setCountdownTime(seconds);
    }
  }, [inputMinutes, inputSeconds, setCountdownTime]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // 初始化倒计时
  useEffect(() => {
    if (mode === 'countdown') {
      setCurrentTime(totalTime);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 计时器主循环
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      if (mode === 'countdown') {
        const remaining = baseTimeRef.current - elapsed;
        if (remaining <= 0) {
          setCurrentTime(0);
          setIsRunning(false);
          setIsFinished(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // 播放提示音（可选）
          try {
            // 简单的蜂鸣
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
          } catch {
            // ignore
          }
        } else {
          setCurrentTime(remaining);
        }
      } else {
        setCurrentTime(baseTimeRef.current + elapsed);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 计算圆环进度
  const progress =
    mode === 'countdown'
      ? (totalTime - currentTime) / totalTime
      : (currentTime % 60) / 60;

  const circleSize = 280;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-gray-900 text-white min-h-[600px] flex flex-col',
        isFullscreen && 'fixed inset-0 z-50 min-h-screen',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => switchMode('countdown')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              mode === 'countdown'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white',
            )}
          >
            <TimerIcon className="w-4 h-4" />
            倒计时
          </button>
          <button
            onClick={() => switchMode('stopwatch')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              mode === 'stopwatch'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white',
            )}
          >
            <Clock className="w-4 h-4" />
            正计时
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          title={isFullscreen ? '退出全屏' : '全屏显示'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Circle */}
        <div className="relative mb-8">
          <svg width={circleSize} height={circleSize} className="transform -rotate-90">
            {/* 背景圆环 */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke="#374151"
              strokeWidth={strokeWidth}
            />
            {/* 进度圆环 */}
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke={getProgressColor()}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100"
            />
          </svg>

          {/* 时间文字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="text-center animate-pulse-flash">
                <div className="text-2xl md:text-3xl font-bold text-red-400 mb-2">
                  ⏰ 时间到！
                </div>
                <div className={cn('text-5xl md:text-6xl font-mono font-bold', getTimeColor())}>
                  {formatTime(0)}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'text-6xl md:text-7xl lg:text-8xl font-mono font-bold tabular-nums transition-colors',
                    getTimeColor(),
                  )}
                  style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                >
                  {formatTime(currentTime)}
                </div>
                {mode === 'countdown' && totalTime > 0 && (
                  <div className="text-gray-500 text-sm mt-2">
                    总时长 {formatTime(totalTime)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors"
            title="重置"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={toggleTimer}
            disabled={mode === 'countdown' && currentTime <= 0 && !isFinished}
            className={cn(
              'w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all shadow-lg',
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-indigo-600 hover:bg-indigo-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isRunning ? (
              <Pause className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" />
            ) : (
              <Play className="w-10 h-10 md:w-12 md:h-12 ml-1" fill="currentColor" />
            )}
          </button>

          {mode === 'stopwatch' ? (
            <button
              onClick={addLap}
              disabled={!isRunning}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="计次"
            >
              <Flag className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-14" />
          )}
        </div>

        {/* Countdown: Presets & Input */}
        {mode === 'countdown' && (
          <div className="mt-10 w-full max-w-md">
            <div className="text-sm text-gray-400 mb-3 text-center">快捷设置</div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {presetTimes.map((preset) => (
                <button
                  key={preset.seconds}
                  onClick={() => setCountdownTime(preset.seconds)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    totalTime === preset.seconds
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Manual Input */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-10 bg-gray-800 border border-gray-700 rounded-xl text-center text-white font-mono text-lg focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-gray-400">分</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) =>
                    setInputSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                  }
                  className="w-16 h-10 bg-gray-800 border border-gray-700 rounded-xl text-center text-white font-mono text-lg focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-gray-400">秒</span>
              </div>
              <button
                onClick={applyManualTime}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        )}

        {/* Stopwatch: Laps */}
        {mode === 'stopwatch' && laps.length > 0 && (
          <div className="mt-8 w-full max-w-md">
            <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              计次记录 ({laps.length})
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-800/50 rounded-xl p-3">
              {laps.map((lap) => (
                <div
                  key={lap.index}
                  className="flex items-center justify-between text-sm font-mono"
                >
                  <span className="text-gray-400">#{lap.index}</span>
                  <span className="text-emerald-400">+{formatTime(lap.time)}</span>
                  <span className="text-white">{formatTime(lap.totalTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
