// src/components/SearchResults.tsx

import React from 'react';
import { DataTable } from '@/components/DataTable';
import { columns } from '@/components/columns';

interface Temple {
  temple_id: string;
  temple_name: string;
  location: string;
  description: string;
  state: { state_name: string } | null;
  services: Array<{ service: { service_name: string } }> | null;
  religions: Array<{ religion: { religion_name: string } }> | null;
  gods: Array<{ god: { god_name: string } }> | null;
}

interface SearchResultsProps {
  results: Temple[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="mt-8">
      <DataTable columns={columns} data={results} />
    </div>
  );
}
