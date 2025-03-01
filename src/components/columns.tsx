// src/components/columns.tsx

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Listing {
  listing_id: string;
  listing_name: string;
  location: string;
  description: string;
  state: { state_name: string } | null;
  services: Array<{ service: { service_name: string } }> | null;
  religions: Array<{ religion: { religion_name: string } }> | null;
  gods: Array<{ god: { god_name: string } }> | null;
  tag: { tag_name: string } | null; // 新增 tag 屬性，若沒有資料則為 null
}

export const columns: ColumnDef<Listing>[] = [
    // 新增 Tag 欄位
  {
    header: '標籤',
    accessorFn: (row) => row.tag?.tag_name || '未知',
    id: 'tag',
  },
  {
    header: '宗教',
    accessorFn: (row) =>
      row.religions?.map((r) => r.religion.religion_name).join(', ') || '未知',
    id: 'religions',
  },
  {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="px-0"
      >
        寺廟
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    ),
    accessorKey: 'listing_name',
    enableSorting: true,
  },
  {
    header: '區分',
    accessorFn: (row) => row.state?.state_name || '未知',
    id: 'state',
  },
  {
    header: '神祇',
    accessorFn: (row) =>
      row.gods?.map((g) => g.god.god_name).join(', ') || '未有資料',
    id: 'gods',
  },
  {
    header: '提供服務',
    accessorFn: (row) =>
      row.services?.map((s) => s.service.service_name).join(', ') || '未知',
    id: 'services',
  },
];
