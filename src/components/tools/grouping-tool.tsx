'use client';

import { useState, useEffect } from 'react';
import { Shuffle, Copy, RefreshCw, Lock, Unlock, Download, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Props {
  isFullscreen?: boolean;
}

interface Member {
  id: string;
  name: string;
  locked: boolean;
}

interface Group {
  id: string;
  name: string;
  members: Member[];
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
  '郑十一',
  '冯十二',
  '陈十三',
  '褚十四',
];

const GROUP_COLORS = [
  'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
  'from-rose-500/20 to-rose-600/10 border-rose-500/30',
];

function SortableMemberItem({
  member,
  onToggleLock,
}: {
  member: Member;
  onToggleLock: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
    disabled: member.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors',
        member.locked
          ? 'bg-amber-500/10 border border-amber-500/30 cursor-default'
          : 'bg-[var(--muted)] cursor-grab active:cursor-grabbing hover:bg-[var(--muted)]/80'
      )}
    >
      <span className={member.locked ? 'text-amber-400' : ''}>{member.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock(member.id);
        }}
        className={cn(
          'p-1 rounded transition-colors',
          member.locked ? 'text-amber-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )}
        title={member.locked ? '取消锁定' : '锁定该成员'}
      >
        {member.locked ? <Lock size={12} /> : <Unlock size={12} />}
      </button>
    </div>
  );
}

export default function GroupingTool({ isFullscreen = false }: Props) {
  const [names, setNames] = useState(DEFAULT_NAMES.join('\n'));
  const [mode, setMode] = useState<'count' | 'size'>('count');
  const [groupCount, setGroupCount] = useState(3);
  const [groupSize, setGroupSize] = useState(4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('grouping-names');
      if (saved) setNames(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('grouping-names', names);
  }, [names]);

  const nameList = names
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const doGrouping = () => {
    if (nameList.length < 2) return;

    setIsAnimating(true);
    setShowSetup(false);

    // Create member objects
    let members: Member[] = nameList.map((name, i) => ({
      id: `m-${i}-${Date.now()}`,
      name,
      locked: false,
    }));

    // Shuffle
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }

    // Calculate number of groups
    let numGroups = mode === 'count' ? Math.max(1, groupCount) : Math.ceil(members.length / groupSize);
    numGroups = Math.min(numGroups, members.length);

    const newGroups: Group[] = [];
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        id: `g-${i}`,
        name: `第${i + 1}组`,
        members: [],
      });
    }

    // Distribute
    members.forEach((member, i) => {
      newGroups[i % numGroups].members.push(member);
    });

    // Simulate animation
    setTimeout(() => {
      setGroups(newGroups);
      setIsAnimating(false);
    }, 800);
  };

  const toggleLock = (groupId: string, memberId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId ? { ...m, locked: !m.locked } : m
              ),
            }
          : g
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which group the active item is in
    let fromGroupIdx = -1;
    let toGroupIdx = -1;
    let member: Member | null = null;

    groups.forEach((g, gi) => {
      const mi = g.members.findIndex((m) => m.id === active.id);
      if (mi !== -1) {
        fromGroupIdx = gi;
        member = g.members[mi];
      }
      if (g.members.findIndex((m) => m.id === over.id) !== -1) {
        toGroupIdx = gi;
      }
    });

    if (fromGroupIdx === -1 || toGroupIdx === -1 || !member) return;
    if ((member as Member).locked) return;

    if (fromGroupIdx === toGroupIdx) {
      // Reorder within same group
      const group = groups[fromGroupIdx];
      const oldIndex = group.members.findIndex((m) => m.id === active.id);
      const newIndex = group.members.findIndex((m) => m.id === over.id);
      const newMembers = arrayMove(group.members, oldIndex, newIndex);
      setGroups((prev) =>
        prev.map((g, i) => (i === fromGroupIdx ? { ...g, members: newMembers } : g))
      );
    } else {
      // Move between groups
      setGroups((prev) => {
        const newGroups = prev.map((g) => ({ ...g, members: [...g.members] }));
        const fromG = newGroups[fromGroupIdx];
        const toG = newGroups[toGroupIdx];
        const idx = fromG.members.findIndex((m) => m.id === active.id);
        if (idx === -1) return prev;
        const [moved] = fromG.members.splice(idx, 1);
        const toIdx = toG.members.findIndex((m) => m.id === over.id);
        toG.members.splice(toIdx >= 0 ? toIdx : toG.members.length, 0, moved);
        return newGroups;
      });
    }
  };

  const regroup = () => {
    // Collect all unlocked members
    const allUnlocked: Member[] = [];
    const lockedGroups: { groupId: string; members: Member[] }[] = [];

    groups.forEach((g) => {
      const locked: Member[] = [];
      g.members.forEach((m) => {
        if (m.locked) locked.push(m);
        else allUnlocked.push(m);
      });
      lockedGroups.push({ groupId: g.id, members: locked });
    });

    // Shuffle unlocked
    for (let i = allUnlocked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allUnlocked[i], allUnlocked[j]] = [allUnlocked[j], allUnlocked[i]];
    }

    // Redistribute
    const numGroups = groups.length;
    const newGroups = groups.map((g, i) => ({
      ...g,
      members: [...lockedGroups[i].members],
    }));

    allUnlocked.forEach((member, i) => {
      newGroups[i % numGroups].members.push(member);
    });

    setIsAnimating(true);
    setTimeout(() => {
      setGroups(newGroups);
      setIsAnimating(false);
    }, 600);
  };

  const exportResult = async () => {
    const text = groups
      .map((g, i) => `第${i + 1}组：${g.members.map((m) => m.name).join('、')}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const backToSetup = () => {
    setShowSetup(true);
    setGroups([]);
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[var(--primary)]" />
          <span className="text-sm font-medium">
            {showSetup ? '设置分组' : `分组结果（${groups.reduce((s, g) => s + g.members.length, 0)}人）`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!showSetup && (
            <>
              <button
                onClick={exportResult}
                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--muted)] hover:bg-[var(--muted)]/80 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <span className="text-[var(--success)]">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} /> 导出
                  </>
                )}
              </button>
              <button
                onClick={backToSetup}
                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--muted)] hover:bg-[var(--muted)]/80"
              >
                重新设置
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {showSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h3 className="font-semibold mb-3">人员名单</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  每行一个名字，共 <span className="font-semibold text-[var(--foreground)]">{nameList.length}</span> 人
                </p>
                <textarea
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  rows={10}
                  placeholder="张三&#10;李四&#10;王五"
                  className="w-full p-4 rounded-xl text-sm resize-none font-mono"
                />
              </div>

              <div className="glass-card rounded-2xl p-6 mb-6">
                <h3 className="font-semibold mb-4">分组方式</h3>
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setMode('count')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      mode === 'count'
                        ? 'gradient-bg text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    按组数分
                  </button>
                  <button
                    onClick={() => setMode('size')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      mode === 'size'
                        ? 'gradient-bg text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    按每组人数分
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                    {mode === 'count' ? '组数' : '每组人数'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={mode === 'count' ? nameList.length : 50}
                    value={mode === 'count' ? groupCount : groupSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (mode === 'count') setGroupCount(val);
                      else setGroupSize(val);
                    }}
                    className="w-24 px-4 py-2 rounded-xl text-center font-semibold"
                  />
                  <div className="flex gap-2">
                    {mode === 'count'
                      ? [2, 3, 4, 6, 8].map((n) => (
                          <button
                            key={n}
                            onClick={() => setGroupCount(n)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium ${
                              groupCount === n
                                ? 'gradient-bg text-white'
                                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                            }`}
                          >
                            {n}
                          </button>
                        ))
                      : [2, 3, 4, 5, 6].map((n) => (
                          <button
                            key={n}
                            onClick={() => setGroupSize(n)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium ${
                              groupSize === n
                                ? 'gradient-bg text-white'
                                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                  </div>
                </div>
              </div>

              <button
                onClick={doGrouping}
                disabled={nameList.length < 2}
                className="w-full py-4 rounded-2xl gradient-bg text-white font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Shuffle size={20} />
                开始随机分组
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {isAnimating ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Shuffle
                      size={48}
                      className="mx-auto mb-4 text-[var(--primary)] animate-spin"
                    />
                    <p className="text-[var(--muted-foreground)]">正在随机分组...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={regroup}
                      className="px-6 py-2.5 rounded-xl bg-[var(--muted)] text-sm font-medium flex items-center gap-2 hover:bg-[var(--muted)]/80 transition-colors"
                    >
                      <RefreshCw size={16} />
                      重新分组（锁定的成员不动）
                    </button>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groups.map((group, idx) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`rounded-2xl border bg-gradient-to-b p-5 ${GROUP_COLORS[idx % GROUP_COLORS.length]}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">{group.name}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-white/10 font-medium">
                              {group.members.length}人
                            </span>
                          </div>
                          <SortableContext
                            items={group.members.map((m) => m.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {group.members.map((member) => (
                                <SortableMemberItem
                                  key={member.id}
                                  member={member}
                                  onToggleLock={(id) => toggleLock(group.id, id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </motion.div>
                      ))}
                    </div>
                  </DndContext>

                  <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
                    💡 提示：点击成员右侧的锁定图标可锁定该成员，拖拽可在组间调整
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
