import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMMS 会务管理系统',
  description: 'Conference Management & Member Service',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
