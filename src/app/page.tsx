"use client";

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import GoogleMapComponent from '@/components/GoogleMapComponent';


interface Temple {
  temple_id: string;
  temple_name: string;
  lat: number;
  lng: number;
  // ... 其他字段
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<Temple[]>([]);

  const handleSearch = (results: Temple[]) => {
    setSearchResults(results);
  };

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl">拜拜 - Pray Pray</h1>
      </header>

      <main className="mt-8">
        <SearchBar onSearch={handleSearch} />
        <GoogleMapComponent
          markers={searchResults.map((temple) => ({
            lat: temple.lat,
            lng: temple.lng,
            temple_name: temple.temple_name,
          }))}
        />
        <SearchResults results={searchResults} />
      </main>

      <footer className="mt-16 text-center">
        <p>版權所有 © 2024</p>
      </footer>
    </div>
  );
}
