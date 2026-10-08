import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Cpu, PlusCircle, LayoutDashboard, Terminal, GitPullRequest, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nexus — Autonomous AI Software Engineering Team',
  description: 'Full-cycle multi-agent autonomous engineering platform from PRD to verified Pull Request.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {/* Global Navigation Bar */}
        <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold tracking-tight text-white text-lg">NEXUS</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      v1.0 MVP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 -mt-0.5">Autonomous AI Software Engineering Team</p>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/tasks/new"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Task</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-400">6 Specialized Agents Ready</span>
              </div>
              <Link
                href="/tasks/new"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Launch Task</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Body View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          Nexus Autonomous Engineering System &copy; 2026 &bull; PRD &bull; Architecture &bull; Development &bull; Playwright Testing &bull; Self-Correction &bull; Review &bull; Pull Request
        </footer>
      </body>
    </html>
  );
}
