'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Users,
  Settings2,
  Plus,
  X,
  History,
  Maximize2,
  ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isFullscreen?: boolean;
}

const DEFAULT_NAMES = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
  '孙八',
  '周九',
  '吴十',
];

export default function RandomNameTool({ isFullscreen = false }: Props) {
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [currentName, setCurrentName] = useState('点击开始');
  const [isRolling, setIsRolling] = useState(false);
  const [isPicked, setIsPicked] = useState(false);
  const [noRepeat, setNoRepeat] = useState(false);
  const [pickedNames, setPickedNames] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState(DEFAULT_NAMES.join('\n'));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rollStartTime = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('random-names');
      if (saved) {
        const arr = JSON.parse(saved);
        setNames(arr);
        setNameInput(arr.join('\n'));
      }
      const savedPicked = localStorage.getItem('random-names-picked');
      if (savedPicked) setPickedNames(JSON.parse(savedPicked));
      const savedNoRepeat = localStorage.getItem('random-no-repeat');
      if (savedNoRepeat) setNoRepeat(savedNoRepeat === 'true');
    } catch {
      // ignore
    }
  }, []);

  // Save names
  useEffect(() => {
    localStorage.setItem('random-names', JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem('random-names-picked', JSON.stringify(pickedNames));
  }, [pickedNames]);

  useEffect(() => {
    localStorage.setItem('random-no-repeat', String(noRepeat));
  }, [noRepeat]);

  const getAvailableNames = useCallback(() => {
    if (!noRepeat) return names;
    return names.filter((n) => !pickedNames.includes(n));
  }, [names, pickedNames, noRepeat]);

  const roll = useCallback(() => {
    const available = getAvailableNames();
    if (available.length === 0) {
      setCurrentName('已全部点完');
      return;
    }

    setIsRolling(true);
    setIsPicked(false);
    rollStartTime.current = Date.now();

    const totalDuration = 1500;
    const animate = () => {
      const elapsed = Date.now() - rollStartTime.current;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease out - slow down gradually
      const interval = 50 + progress * 450;
      const randomName = available[Math.floor(Math.random() * available.length)];
      setCurrentName(randomName);

      if (progress < 1) {
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, interval);
      } else {
        // Stop on final name
        const finalName = available[Math.floor(Math.random() * available.length)];
        setCurrentName(finalName);
        setIsRolling(false);
        setIsPicked(true);

        if (noRepeat) {
          setPickedNames((prev) => [...prev, finalName]);
        }
        setHistory((prev) => [finalName, ...prev].slice(0, 20));
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [getAvailableNames, noRepeat]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRolling) roll();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRolling, roll]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const resetPicked = () => {
    setPickedNames([]);
    setCurrentName('点击开始');
    setIsPicked(false);
  };

  const applyNames = () => {
    const newNames = nameInput
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setNames(newNames);
    setPickedNames([]);
    setCurrentName('点击开始');
    setIsPicked(false);
    setShowSettings(false);
  };

  const availableCount = getAvailableNames().length;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            title="显示/隐藏面板"
          >
            <Users size={20} />
          </button>
          <div className="text-sm text-[var(--muted-foreground)]">
            共 <span className="font-semibold text-[var(--foreground)]">{names.length}</span> 人
            {noRepeat && (
              <>
                {' · '}剩余{' '}
                <span className="font-semibold text-[var(--success)]">{availableCount}</span> 人
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            title="名单设置"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        <AnimatePresence>
          {showPanel && !isFullscreen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[var(--border)] overflow-hidden flex-shrink-0"
            >
              <div className="p-4 h-full overflow-y-auto">
                {/* No Repeat Toggle */}
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setNoRepeat(!noRepeat)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        noRepeat ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          noRepeat ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <ListChecks size={16} /> 不重复抽取
                    </span>
                  </label>
                </div>

                {/* History */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <History size={14} /> 抽取历史
                    </h3>
                    {history.length > 0 && (
                      <button
                        onClick={resetPicked}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                      >
                        重置
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">
                        暂无抽取记录
                      </p>
                    ) : (
                      history.map((name, i) => (
                        <div
                          key={i}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            i === 0
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                              : 'text-[var(--muted-foreground)]'
                          }`}
                        >
                          {i + 1}. {name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Picked list (no-repeat mode) */}
                {noRepeat && pickedNames.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">已点名单</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {pickedNames.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] line-through"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">名单管理</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--muted)]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  每行一个名字，粘贴或输入学生名单
                </p>
                <textarea
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  rows={12}
                  className="w-full p-3 rounded-xl text-sm resize-none"
                  placeholder="张三&#10;李四&#10;王五"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--muted)] text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={applyNames}
                    className="flex-1 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium"
                  >
                    应用
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div
            onClick={roll}
            className="cursor-pointer select-none text-center w-full flex-1 flex flex-col items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentName + (isPicked ? 'picked' : 'rolling')}
                initial={isPicked ? { scale: 0.5, opacity: 0 } : {}}
                animate={isPicked ? { scale: 1.1, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`font-bold leading-none ${
                  isFullscreen ? 'text-8xl md:text-9xl' : 'text-6xl md:text-8xl'
                } ${
                  isPicked
                    ? 'gradient-text drop-shadow-lg'
                    : isRolling
                    ? 'text-[var(--muted-foreground)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                {currentName}
              </motion.div>
            </AnimatePresence>

            {!isRolling && !isPicked && names.length > 0 && (
              <p className="mt-8 text-[var(--muted-foreground)] text-sm">
                点击屏幕或按空格键开始点名
              </p>
            )}

            {isPicked && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-lg text-[var(--primary)] font-medium"
              >
                🎉 恭喜被选中！
              </motion.p>
            )}
          </div>

          {/* Bottom controls */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={roll}
              disabled={isRolling || availableCount === 0}
              className="px-8 py-3 rounded-xl gradient-bg text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              {isRolling ? '抽取中...' : '开始点名'}
            </button>
            {(pickedNames.length > 0 || isPicked) && (
              <button
                onClick={resetPicked}
                className="px-6 py-3 rounded-xl bg-[var(--muted)] font-medium flex items-center gap-2 hover:bg-[var(--muted)]/80 transition-colors"
              >
                <RotateCcw size={18} />
                重置
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
