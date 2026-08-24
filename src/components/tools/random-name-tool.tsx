'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Users, Shuffle, List, ListEnd, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

const DEFAULT_NAMES = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '陈七',
  '周八',
  '吴九',
  '郑十',
  '孙明',
  '李华',
  '王芳',
  '刘洋',
];

export function RandomNameTool() {
  const [namesText, setNamesText] = useLocalStorage(
    'random-names-list',
    DEFAULT_NAMES.join('\n'),
  );
  const [noRepeat, setNoRepeat] = useLocalStorage('random-names-no-repeat', false);
  const [pickedNames, setPickedNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('点击开始');
  const [isRolling, setIsRolling] = useState(false);
  const [isPicked, setIsPicked] = useState(false);
  const [showListPanel, setShowListPanel] = useState(false);

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const names = namesText
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const availableNames = noRepeat
    ? names.filter((n) => !pickedNames.includes(n))
    : names;

  const roll = useCallback(() => {
    if (availableNames.length === 0) return;

    if (isRolling) {
      // 停止滚动
      stopRolling();
      return;
    }

    setIsRolling(true);
    setIsPicked(false);

    // 快速滚动效果
    let rollCount = 0;
    const totalRolls = 30; // 滚动次数
    const baseInterval = 50; // 基础间隔

    const doRoll = () => {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      setCurrentName(availableNames[randomIndex]);
      rollCount++;

      if (rollCount < totalRolls) {
        // 逐渐变慢
        const delay = baseInterval + (rollCount / totalRolls) * 100;
        rollTimeoutRef.current = setTimeout(doRoll, delay);
      } else {
        // 最终定格
        const finalIndex = Math.floor(Math.random() * availableNames.length);
        const picked = availableNames[finalIndex];
        setCurrentName(picked);
        setIsRolling(false);
        setIsPicked(true);

        if (noRepeat) {
          setPickedNames((prev) => [...prev, picked]);
        }
      }
    };

    doRoll();
  }, [availableNames, isRolling, noRepeat]);

  const stopRolling = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    setIsRolling(false);
  }, []);

  const resetPicked = () => {
    setPickedNames([]);
    setCurrentName('点击开始');
    setIsPicked(false);
  };

  // 键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        roll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roll]);

  // 清理
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  // 当名单变化且当前没名字时重置
  useEffect(() => {
    if (currentName === '点击开始' && pickedNames.length === 0) return;
    if (names.length === 0) {
      setCurrentName('请添加名单');
      setIsPicked(false);
    }
  }, [names.length, currentName, pickedNames.length]);

  const allPicked = noRepeat && availableNames.length === 0 && names.length > 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px]">
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                共 {names.length} 人
              </span>
            </div>
            {noRepeat && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <Shuffle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  剩余 {availableNames.length} 人
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noRepeat}
                onChange={(e) => {
                  setNoRepeat(e.target.checked);
                  if (e.target.checked) {
                    setPickedNames([]);
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">不重复抽取</span>
            </label>

            <button
              onClick={resetPicked}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>

            <button
              onClick={() => setShowListPanel(!showListPanel)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm"
            >
              <List className="w-4 h-4" />
              名单
            </button>
          </div>
        </div>

        {/* Name Display */}
        <div
          className={cn(
            'flex-1 flex items-center justify-center cursor-pointer select-none transition-colors',
            isPicked ? 'bg-gradient-to-b from-amber-50 to-white' : 'bg-white',
          )}
          onClick={roll}
        >
          <div className="text-center px-4">
            <div
              className={cn(
                'font-bold text-indigo-600 transition-all duration-300',
                isPicked ? 'text-6xl md:text-8xl lg:text-9xl animate-bounce-in' : 'text-5xl md:text-7xl lg:text-8xl',
                isRolling && 'scale-105',
                allPicked && 'text-gray-400 text-3xl md:text-5xl',
              )}
              style={{
                textShadow: isPicked
                  ? '0 4px 20px rgba(79, 70, 229, 0.2)'
                  : 'none',
              }}
            >
              {allPicked ? '🎉 全部抽完了！' : currentName}
            </div>

            <p className="mt-6 text-gray-400 text-sm md:text-base">
              {isRolling
                ? '滚动中... 点击停止'
                : allPicked
                  ? '点击重置重新开始'
                  : '点击屏幕或按空格键开始抽取'}
            </p>
          </div>
        </div>

        {/* Bottom: Mobile Picked List */}
        {!showListPanel && pickedNames.length > 0 && (
          <div className="lg:hidden p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ListEnd className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                已抽取 ({pickedNames.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {pickedNames.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm"
                >
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Panel - Name List */}
      <div
        className={cn(
          'lg:w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col',
          showListPanel
            ? 'fixed inset-0 z-50 bg-white'
            : 'hidden lg:flex',
        )}
      >
        {showListPanel && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
            <h3 className="font-semibold text-gray-900">名单管理</h3>
            <button
              onClick={() => setShowListPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        <div className="p-4 lg:p-6 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <List className="w-4 h-4 text-indigo-600" />
            学生名单
          </h3>
          <p className="text-xs text-gray-400 mb-3">每行一个名字，自动保存</p>

          <textarea
            value={namesText}
            onChange={(e) => {
              setNamesText(e.target.value);
              setPickedNames([]);
              setCurrentName('点击开始');
              setIsPicked(false);
            }}
            className="flex-1 w-full p-3 bg-white rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-sm text-gray-700 resize-none min-h-[200px] lg:min-h-0"
            placeholder="请输入学生名单，每行一个名字"
          />
        </div>

        {/* Picked List */}
        <div className="p-4 lg:p-6 border-t border-gray-200/50">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ListEnd className="w-4 h-4 text-amber-500" />
            已抽取 ({pickedNames.length})
          </h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {pickedNames.length > 0 ? (
              pickedNames.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm"
                >
                  {i + 1}. {name}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-400">暂无抽取记录</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
