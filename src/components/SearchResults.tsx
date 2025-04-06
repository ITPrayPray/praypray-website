// src/components/SearchResults.tsx

import React from 'react';
import { DataTable } from '@/components/DataTable';
import { columns } from '@/components/columns';
import { ColumnDef } from '@tanstack/react-table';

export interface Listing {
  listing_id: string;
  listing_name: string;
  location: string;
  description: string;
  state: { state_name: string } | null;
  services: Array<{ service: { service_name: string } }> | null;
  religions: Array<{ religion: { religion_name: string } }> | null;
  gods: Array<{ god: { god_name: string } }> | null;
}

interface SearchResultsProps {
  results: Listing[];
  onSelectResult?: (listingId: string) => void;
}

export default function SearchResults({ results, onSelectResult }: SearchResultsProps) {
  return (
    <div className="mt-8">
      <DataTable 
        columns={columns as ColumnDef<Listing, string>[]} 
        data={results} 
        onRowClick={onSelectResult ? (row) => onSelectResult(row.listing_id) : undefined}
      />
    </div>
  );
}
