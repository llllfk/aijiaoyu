'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Plus, Wrench, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api-client';
import { subjects } from '@/data/subjects';

interface Tool {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  subject: string;
  description: string;
  usage: string;
  useCount: number;
  isActive: boolean;
}

const COMPONENT_OPTIONS = [
  { value: 'random-name-picker', label: '随机点名器' },
  { value: 'class-timer', label: '课堂计时器' },
  { value: 'function-plotter', label: '函数图像绘制器' },
  { value: 'wheel-of-names', label: '转盘抽奖' },
  { value: 'random-grouping', label: '随机分组器' },
  { value: 'mind-map', label: '思维导图' },
  { value: 'periodic-table', label: '化学元素周期表' },
];

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    emoji: '',
    subject: 'math',
    description: '',
    usage: '',
  });
  const [saving, setSaving] = useState(false);

  const loadTools = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/tools');
      setTools((data as any).tools || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTools();
  }, []);

  const openCreate = () => {
    setEditingTool(null);
    setForm({ name: '', slug: '', emoji: '🔧', subject: 'math', description: '', usage: '' });
    setShowModal(true);
  };

  const openEdit = (tool: Tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name,
      slug: tool.slug,
      emoji: tool.emoji,
      subject: tool.subject,
      description: tool.description,
      usage: tool.usage,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.emoji) return;
    setSaving(true);
    try {
      if (editingTool) {
        await api.put(`/admin/tools/${editingTool.id}`, form);
      } else {
        await api.post('/admin/tools', form);
      }
      setShowModal(false);
      loadTools();
    } catch (e: any) {
      alert(e?.message || '保存失败');
    }
    setSaving(false);
  };

  const toggleActive = async (tool: Tool) => {
    try {
      await api.put(`/admin/tools/${tool.id}`, { isActive: !tool.isActive });
      loadTools();
    } catch {
      alert('操作失败');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">工具管理</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              共 {tools.length} 个工具
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            新增工具
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">工具</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">学科</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">使用次数</th>
                  <th className="text-left font-medium text-[var(--muted-foreground)] px-5 py-3">状态</th>
                  <th className="text-right font-medium text-[var(--muted-foreground)] px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[var(--muted-foreground)]">
                      加载中...
                    </td>
                  </tr>
                ) : tools.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[var(--muted-foreground)]">
                      暂无工具
                    </td>
                  </tr>
                ) : (
                  tools.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center text-xl">
                            {t.emoji}
                          </div>
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{t.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                        {subjects.find((s) => s.id === t.subject)?.name || t.subject}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{t.useCount}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => toggleActive(t)}>
                          {t.isActive ? (
                            <ToggleRight size={24} className="text-[var(--success)]" />
                          ) : (
                            <ToggleLeft size={24} className="text-[var(--muted-foreground)]" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Edit2 size={12} />
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingTool ? '编辑工具' : '新增工具'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">工具名称</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl"
                    placeholder="如：随机点名器"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">Emoji图标</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-center text-xl"
                    placeholder="🎲"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">组件标识</label>
                  <select
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl"
                  >
                    <option value="">选择组件</option>
                    {COMPONENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">学科分类</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">一句话简介</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl"
                  placeholder="简短描述工具功能"
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)] mb-1.5 block">使用说明</label>
                <textarea
                  value={form.usage}
                  onChange={(e) => setForm({ ...form, usage: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl resize-none"
                  placeholder="详细使用说明..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--muted)] text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.slug}
                className="flex-1 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
