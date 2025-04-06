'use client';

import React, { useEffect, useRef, useCallback } from 'react';
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
  const mapRef = useRef<google.maps.Map | null>(null);

  // Use useJsApiLoader for consistent loading
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script', // Use the same consistent ID
  });
  
  const onLoad = useCallback(function callback(map: google.maps.Map) {
    console.log("Detail map loaded successfully");
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback() {
    console.log("Detail map unmounted");
    mapRef.current = null;
  }, []);
  
  // Simplified useEffect for cleanup
  useEffect(() => {
    return () => {
      console.log('LocationMap unmounting');
    };
  }, []);

  const handleOpenMap = () => {
    if (google_map_link) {
      window.open(google_map_link, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle loading error
  if (loadError) {
    console.error("Detail Map loading error:", loadError);
    return (
      <div className="w-full space-y-4">
        <div className="w-full h-[300px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden flex items-center justify-center bg-gray-100 border border-border">
          <p className="text-red-500">Error loading map.</p>
        </div>
        {/* Keep button accessible even if map fails */}
        {google_map_link && (
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenMap}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              在 Google Maps 開啟
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show loading skeleton
  if (!isLoaded) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="w-full h-[300px] md:h-[350px] lg:h-[400px] rounded-xl" />
        {google_map_link && (
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenMap}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              在 Google Maps 開啟
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render map once loaded
  return (
    <div className="w-full space-y-4">
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
            gestureHandling: 'cooperative',
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Marker doesn't need mapLoaded check here as the parent GoogleMap only renders when isLoaded is true */}
          <Marker position={{ lat, lng }} />
        </GoogleMap>
      </div>

      {/* Button remains the same */}
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

// Keep global declaration
declare global {
  interface Window {
    google: typeof google;
  }
}