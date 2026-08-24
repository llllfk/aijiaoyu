import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: '智学工具 - 让每一堂课都充满互动',
    template: '%s | 智学工具',
  },
  description:
    '智学工具是面向中小学教师的AI赋能学科交互教学工具平台，提供随机点名、课堂计时、函数绘图、转盘抽奖等丰富工具。',
  keywords: ['教学工具', '课堂互动', '随机点名', '计时器', '函数绘图', '教师工具'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
