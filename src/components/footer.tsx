import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold">
                智
              </div>
              <span className="font-bold text-xl">
                智学<span className="gradient-text">工具</span>
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-md">
              面向中小学教师的AI赋能学科交互教学工具平台，让每一堂课都充满互动与乐趣。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">产品</h4>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>
                <Link href="/tools" className="hover:text-[var(--foreground)] transition-colors">
                  工具库
                </Link>
              </li>
              <li>
                <Link href="/tools/random-name" className="hover:text-[var(--foreground)] transition-colors">
                  随机点名
                </Link>
              </li>
              <li>
                <Link href="/tools/timer" className="hover:text-[var(--foreground)] transition-colors">
                  课堂计时
                </Link>
              </li>
              <li>
                <Link href="/tools/function-plotter" className="hover:text-[var(--foreground)] transition-colors">
                  函数绘图
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">关于</h4>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>
                <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <a href="mailto:support@zhixue.com" className="hover:text-[var(--foreground)] transition-colors">
                  联系我们
                </a>
              </li>
              <li>
                <Link href="#" className="hover:text-[var(--foreground)] transition-colors">
                  使用帮助
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} 智学工具. 保留所有权利.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            用心做教育，让课堂更精彩
          </p>
        </div>
      </div>
    </footer>
  );
}
