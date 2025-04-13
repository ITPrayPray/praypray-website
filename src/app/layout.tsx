// src/app/layout.tsx
// Remove 'use client' directive if no longer needed at this level

// import type { Metadata } from "next"; // Keep if needed for metadata later
// import { useState } from 'react'; // No longer needed for client creation here
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Removed old helper
// import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Removed Provider
import "./globals.css";
import AppShell from '@/components/AppShell';

// Metadata can potentially be re-added here if layout is a Server Component
export const metadata = {
  title: '拜拜',
  description: 'Pray Pray - Gods and listings exploration and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove client creation and provider wrapper
  // const [supabaseClient] = useState(() => createClientComponentClient());

  return (
    <html lang="zh-Hant">
      <body>
        {/* 
        <SessionContextProvider
          supabaseClient={supabaseClient}
        >
        */} 
          <AppShell>{children}</AppShell>
        {/* </SessionContextProvider> */}
      </body>
    </html>
  );
}
