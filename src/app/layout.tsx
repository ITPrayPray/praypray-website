// src/app/layout.tsx
'use client';

// import type { Metadata } from "next"; // Keep if needed for metadata later
import { useState } from 'react'; // Re-add useState
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Re-add client helper
import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Re-add Provider
import "./globals.css";
import AppShell from '@/components/AppShell';
import { RevenueCatProvider } from '@/components/providers/RevenueCatProvider';

// Metadata can potentially be re-added here if layout is a Server Component
// export const metadata = {
//   title: '拜拜',
//   description: 'Pray Pray - Gods and listings exploration and more.',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-create Supabase client instance
  const [supabaseClient] = useState(() => createClientComponentClient());

  return (
    <html lang="zh-Hant">
      <body>
        <SessionContextProvider
          supabaseClient={supabaseClient}
        >
          <RevenueCatProvider>
            <AppShell>{children}</AppShell>
          </RevenueCatProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}
