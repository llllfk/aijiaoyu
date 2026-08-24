import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: '智学工坊 - AI赋能的学科交互教学工具',
    template: '%s | 智学工坊',
  },
  description:
    '智学工坊是专为中小学教师打造的AI赋能学科交互教学工具平台，提供随机点名、课堂计时、函数图像绘制等丰富工具，让教学更高效、更有趣。',
  keywords: ['教学工具', '课堂互动', '随机点名', '计时器', '函数绘图', '中小学教育', '教师工具'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
