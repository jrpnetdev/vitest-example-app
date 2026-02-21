import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow – Smart Task Manager',
  description: 'A Next.js task management app with comprehensive Vitest test coverage.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>✅</span>
            <h1 className="text-xl font-bold text-blue-700 tracking-tight">TaskFlow</h1>
            <span className="text-xs rounded-full bg-blue-100 text-blue-600 px-2 py-0.5 font-medium">
              Beta
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t mt-16 py-6 text-center text-xs text-gray-400">
          TaskFlow · Built with Next.js 14 &amp; Vitest
        </footer>
      </body>
    </html>
  );
}
