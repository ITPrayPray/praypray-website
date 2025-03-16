'use client';

import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';

interface LocationMapProps {
  lat: number;
  lng: number;
  google_map_link?: string;
}

function LocationMap({ lat, lng, google_map_link }: LocationMapProps) {
  console.log('LocationMap render:', { lat, lng, google_map_link });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const handleOpenMap = () => {
    if (google_map_link) {
      window.open(google_map_link, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isLoaded) {
    return <Skeleton className="w-full h-[400px] rounded-xl" />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Map Container with fixed height */}
      <div className="w-full h-[300px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden shadow-sm border border-border">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat, lng }}
          zoom={15}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker position={{ lat, lng }} />
        </GoogleMap>
      </div>

      {/* Button Container */}
      <div className="flex justify-end">
        <Button
          variant="default"
          size="sm"
          onClick={handleOpenMap}
          disabled={!google_map_link}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          在 Google Maps 開啟
        </Button>
      </div>
    </div>
  );
}

export { LocationMap };

// Add proper type for google maps
declare global {
  interface Window {
    google: typeof google;
  }
}