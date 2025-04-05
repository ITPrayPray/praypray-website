"use client";

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import GoogleMapComponent from '@/components/GoogleMapComponent';


interface Listing {
  listing_id: string;
  listing_name: string;
  lat: number;
  lng: number;
  location: string;
  description: string;
  gods: Array<{god: {god_name: string}}> | null;
  image_urls?: string[];
  state: { state_name: string } | null;
  services: Array<{ service: { service_name: string } }> | null;
  religions: Array<{ religion: { religion_name: string } }> | null;
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<Listing[]>([]);

  const handleSearch = (results: Listing[]) => {
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
          markers={searchResults.map((listing) => {
            console.log('Processing listing for map:', listing);
            return {
              lat: listing.lat,
              lng: listing.lng,
              listing_name: listing.listing_name,
              location: listing.location || '',
              listing_id: listing.listing_id,
              gods: listing.gods?.map((g: { god: { god_name: string } }) => g.god?.god_name).join(', ') || '',
              image_urls: listing.image_urls || []
            };
          })}
        />
        <SearchResults results={searchResults as Listing[]} />
      </main>

      <footer className="mt-16 text-center">
        <p>版權所有 © 2024</p>
      </footer>
    </div>
  );
}
