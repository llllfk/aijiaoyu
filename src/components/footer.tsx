import Link from 'next/link';
import { Sparkles, Mail, Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">智学工坊</span>
            </Link>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed mb-4">
              AI赋能的学科交互教学工具平台，为中小学教师提供丰富的课堂互动工具，让教学更高效、更有趣。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:contact@zhixue.work"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                联系我们
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">热门工具</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tools/random-name"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  随机点名器
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/timer"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  课堂计时器
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/function-plotter"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  函数图像绘制器
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">学科分类</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tools?subject=math"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  数学工具
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?subject=physics"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  物理工具
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?subject=chemistry"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  化学工具
                </Link>
              </li>
              <li>
                <Link
                  href="/tools?subject=other"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  通用工具
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <span>© 2025 智学工坊. Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            <span>for teachers</span>
          </p>
          <p className="text-sm text-gray-400">让每一堂课都充满惊喜</p>
        </div>
      </div>
    </footer>
  );
}
