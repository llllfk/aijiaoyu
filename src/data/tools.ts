export type Subject =
  | 'all'
  | 'physics'
  | 'chemistry'
  | 'math'
  | 'biology'
  | 'chinese'
  | 'english'
  | 'history'
  | 'geography'
  | 'other';

export interface Tool {
  id: string;
  name: string;
  slug: string;
  subject: Exclude<Subject, 'all'>;
  emoji: string;
  description: string;
  usageCount: number;
  component: string;
}

export const subjects: { id: Subject; name: string; emoji: string; color: string }[] = [
  { id: 'all', name: '全部', emoji: '🎯', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'math', name: '数学', emoji: '📐', color: 'bg-blue-100 text-blue-700' },
  { id: 'physics', name: '物理', emoji: '⚡', color: 'bg-purple-100 text-purple-700' },
  { id: 'chemistry', name: '化学', emoji: '🧪', color: 'bg-green-100 text-green-700' },
  { id: 'biology', name: '生物', emoji: '🧬', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'chinese', name: '语文', emoji: '📖', color: 'bg-red-100 text-red-700' },
  { id: 'english', name: '英语', emoji: '🔤', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'history', name: '历史', emoji: '📜', color: 'bg-amber-100 text-amber-700' },
  { id: 'geography', name: '地理', emoji: '🌍', color: 'bg-teal-100 text-teal-700' },
  { id: 'other', name: '其他', emoji: '✨', color: 'bg-gray-100 text-gray-700' },
];

export const tools: Tool[] = [
  {
    id: 'random-name',
    name: '随机点名器',
    slug: 'random-name',
    subject: 'other',
    emoji: '🎲',
    description: '课堂随机抽取学生回答问题，支持不重复抽取模式，让每位同学都有参与机会。',
    usageCount: 12580,
    component: 'RandomNameTool',
  },
  {
    id: 'timer',
    name: '课堂计时器',
    slug: 'timer',
    subject: 'other',
    emoji: '⏱️',
    description: '正计时与倒计时双模式，大数字投影清晰，小组讨论、考试计时必备工具。',
    usageCount: 9876,
    component: 'TimerTool',
  },
  {
    id: 'function-plotter',
    name: '函数图像绘制器',
    slug: 'function-plotter',
    subject: 'math',
    emoji: '📈',
    description: '输入函数表达式即可绘制图像，支持多函数对比、参数滑块调节、缩放平移。',
    usageCount: 7654,
    component: 'FunctionPlotterTool',
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsBySubject(subject: Subject): Tool[] {
  if (subject === 'all') return tools;
  return tools.filter((t) => t.subject === subject);
}

export function getSubjectInfo(subjectId: string) {
  return subjects.find((s) => s.id === subjectId);
}
