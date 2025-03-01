'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { ExternalLink, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

interface LocationMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

// Create a non-SSR component that will be loaded client-side only
const LocationMapWithNoSSR = dynamic(
  () => Promise.resolve(LocationMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-96 rounded-xl" />
  }
);

// The inner component that actually contains the Google Map implementation
function LocationMapInner({
  lat,
  lng,
  name,
  address
}: LocationMapProps) {
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    // You might need to add libraries like places if using those features
  });
  
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle directions
  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle view larger map
  const openLargerMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${name}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Check if the Google object is available
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setGoogleLoaded(true);
      }
    };

    // Check if already loaded
    checkGoogleMapsLoaded();

    // If not already loaded, set up an interval to check
    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        setGoogleLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  if (loadError) {
    return (
      <div className="border border-destructive/20 rounded-xl p-6 text-center">
        <p className="text-destructive">Error loading Google Maps</p>
      </div>
    );
  }

  if (!isLoaded || !googleLoaded) {
    return <Skeleton className="w-full h-96 rounded-xl" />;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="w-full h-[400px] rounded-xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat, lng }}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker
            position={{ lat, lng }}
            onClick={() => setIsInfoWindowOpen(true)}
          >
            {isInfoWindowOpen && (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => setIsInfoWindowOpen(false)}
              >
                <div className="p-1">
                  <h3 className="font-medium text-sm">{name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{address}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        </GoogleMap>
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={openDirections}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Directions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={openLargerMap}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Larger Map
        </Button>
      </div>
    </div>
  );
}

// Add the window type for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

// Export the non-SSR wrapped component
export const LocationMap = LocationMapWithNoSSR;