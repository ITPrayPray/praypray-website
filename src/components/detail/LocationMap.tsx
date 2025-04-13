'use client';

import React, { useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';
import { Label } from '../ui/label';

interface LocationMapProps {
  lat?: number | null;
  lng?: number | null;
  google_map_link?: string | null;
}

function LocationMap({ lat, lng, google_map_link }: LocationMapProps) {
  console.log('LocationMap render (Conditional Map):', { lat, lng, google_map_link });
  const mapRef = useRef<google.maps.Map | null>(null);

  const hasValidCoords = lat != null && lng != null && typeof lat === 'number' && typeof lng === 'number';

  // --- Call Hooks Unconditionally --- 
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script-detail', 
    // Load the script regardless, but we only render the map if hasValidCoords is true
  });

  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);
  const onUnmount = useCallback(() => { mapRef.current = null; }, []);
  const handleOpenMap = useCallback(() => { 
      if (google_map_link) { window.open(google_map_link, '_blank', 'noopener,noreferrer'); } 
  }, [google_map_link]); // Add dependency

  // --- Conditional Rendering in JSX --- 
  
  // Helper function for rendering the button
  const renderOpenMapButton = (disabled = false) => (
       google_map_link && (
            <div className="flex justify-end">
                <Button variant="default" size="sm" onClick={handleOpenMap} disabled={disabled} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> 在 Google Maps 開啟
                </Button>
            </div>
       )
  );

  return (
    <div className="w-full space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">地圖位置 (Map Location)</Label>
        
        {/* Case 1: Render Map if coords are valid */}
        {hasValidCoords && (
            <>
                {loadError && (
                    <div className="w-full h-[250px] rounded-md flex items-center justify-center bg-gray-100 border border-destructive">
                        <p className="text-red-500 text-sm">Error loading map.</p>
                    </div>
                )}
                {!loadError && !isLoaded && (
                    <Skeleton className="w-full h-[250px] rounded-md" />
                )}
                {!loadError && isLoaded && (
                    <div className="w-full h-[250px] rounded-md overflow-hidden shadow-sm border border-border">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{ lat: lat!, lng: lng! }}
                            zoom={15}
                            options={{ zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, gestureHandling: 'cooperative' }}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                        >
                            <Marker position={{ lat: lat!, lng: lng! }} />
                        </GoogleMap>
                    </div>
                )}
                {/* Render button below map/skeleton/error */} 
                {renderOpenMapButton(!isLoaded && !loadError)} 
            </>
        )}

        {/* Case 2: No valid coords, but have a link */}
        {!hasValidCoords && google_map_link && (
             <div className="flex justify-start">
                {/* Reuse button rendering function */}
                {renderOpenMapButton()}
            </div>
        )}
        
        {/* Case 3: No coords and no link */}
        {!hasValidCoords && !google_map_link && (
             <p className="text-sm text-muted-foreground">未提供地圖位置信息。(Map location information not provided.)</p>
        )}
    </div>
  );

}

export { LocationMap };

declare global {
  interface Window {
    google: typeof google;
  }
}