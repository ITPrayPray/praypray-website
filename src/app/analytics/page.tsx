// src/app/analytics/page.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming Shadcn Button is here

export default function AnalyticsPage() {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">數據分析 (Analytics)</h1>
          <Link href="/analytics/create" passHref>
            <Button>創建列表 (Create Listing)</Button>
          </Link>
        </div>
        <p className="mb-4">這裡是Analytics頁面的內容。下方將顯示您的列表。(Your listings will appear below.)</p>
        {/* Placeholder for listings table/grid */}
        <div className="border rounded-lg p-4 min-h-[200px] flex items-center justify-center text-muted-foreground">
          <p>目前尚無列表。(No listings yet.)</p>
        </div>
      </div>
    );
  }
  