// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: '拜拜',
  description: 'Pray Pray - Gods and listings exploration and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
