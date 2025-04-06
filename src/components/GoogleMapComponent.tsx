"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from "@react-google-maps/api";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";
import Slider from "react-slick";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface MarkerData {
  lat: number;
  lng: number;
  listing_name: string;
  location: string;
  listing_id: string;
  gods: string;
  image_urls?: string[];
}

const cachedIcons: Record<string, string> = {};

function getIcon(color: string) {
  if (!cachedIcons[color]) {
    const svgString = encodeURIComponent(
      renderToStaticMarkup(<MapPin color={color} />)
    );
    cachedIcons[color] = `data:image/svg+xml,${svgString}`;
  }
  return cachedIcons[color];
}

const containerStyle = {
  width: "100%",
  height: "80vh",
};

const defaultCenter = {
  lat: 22.3964,
  lng: 114.1095,
};

// Keep dynamic import but loading state will be handled inside the component
const GoogleMapWithNoSSR = dynamic(
  () => Promise.resolve(GoogleMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div style={containerStyle} className="bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

function GoogleMapComponent({
  markers,
}: {
  markers: MarkerData[];
}) {
  const router = useRouter();
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Use the hook to load the Google Maps script
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    id: 'google-map-script', // Use a consistent ID
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    console.log("Main Map loaded successfully");
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback() {
    console.log("Main Map unmounted");
    // Basic cleanup, let the library handle most of it
    mapRef.current = null;
  }, []);

  const onMapClick = () => {
    setSelectedMarker(null);
  };

  // Slider settings remain the same
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    lazyLoad: 'ondemand' as const,
    arrows: false,
  };

  // Simplified navigation handler - rely on component unmount for cleanup
  const handleViewDetails = (listingId: string) => {
    console.log('Navigating to details for:', listingId);
    // Close marker before navigation
    setSelectedMarker(null);
    // Navigate using router.push without aggressive cleanup
    // A minimal delay might still help ensure state updates before navigation starts
    setTimeout(() => {
      router.push(`/detail/${encodeURIComponent(String(listingId))}`);
    }, 50); 
  };

  // Simplified useEffect for cleanup - primarily for debugging
  useEffect(() => {
    return () => {
      console.log('GoogleMapComponent unmounting');
      // No aggressive cleanup here, rely on onUnmount and library
    };
  }, []);

  // Handle loading error state
  if (loadError) {
    console.error("Failed to load Google Maps script:", loadError);
    return (
      <div style={containerStyle} className="bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error loading map. Please check the console.</p>
        </div>
      </div>
    );
  }

  // Show loading state until the script is loaded
  if (!isLoaded) {
     return (
      <div style={containerStyle} className="bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  // Render the map once loaded
  return (
    <div ref={mapContainerRef} style={containerStyle}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        // Add options to potentially improve performance/stability
        options={{
          gestureHandling: 'cooperative', 
          disableDefaultUI: false,
        }}
      >
        {/* Render markers only when map is loaded (isLoaded is true) */}
        {markers.map((marker) => (
          <Marker
            key={marker.listing_id}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={{
              text: marker.listing_name,
              className: "hidden",
            }}
            icon={{
              url: getIcon(
                selectedMarker && selectedMarker.listing_id === marker.listing_id
                  ? "#FFD700"
                  : "#000000"
              ),
              // Ensure google object is available before accessing Size
              scaledSize: typeof google !== 'undefined' ? new google.maps.Size(24, 24) : undefined,
            }}
            onClick={() => {
              setSelectedMarker(marker);
            }}
          />
        ))}
        
        {/* Render OverlayView only when map is loaded and marker selected */}
        {selectedMarker && (
          <OverlayView
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className="relative z-50"
              style={{ transform: 'translate(-50%, -100%)', position: 'absolute' }}
            >
              <div className="info-card bg-white rounded-lg overflow-hidden shadow-lg w-72 sm:w-96 md:w-[28rem] lg:w-[32rem] max-w-[25vw] h-[300px] sm:h-[300px] md:h-[300px] max-h-[25vw] flex flex-col">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedMarker(null)}
                >
                  ×
                </button>
                <div className="image-container flex-shrink-0" style={{ flexBasis: '40%' }}>
                  {selectedMarker.image_urls && selectedMarker.image_urls.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {selectedMarker.image_urls.map((url, index) => (
                        <div key={index}>
                          <Image
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-24 sm:h-32 md:h-32 lg:h-40 object-cover"
                            width={400}
                            height={300}
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </Slider>
                  ) : (
                    <div className="no-image bg-gray-200 w-full h-24 sm:h-32 md:h-32 lg:h-40 max-h-[25vw] flex items-center justify-center">
                      <p className="text-gray-600">暫無照片</p>
                    </div>
                  )}
                </div>
                <div className="info-content p-4 sm:p-6 md:p-8 overflow-hidden" style={{ flexBasis: '60%' }}>
                  <h3 className="title text-lg sm:text-xl md:text-2xl font-bold mb-1">
                    {selectedMarker.listing_name}
                  </h3>
                  <p className="description text-sm sm:text-base md:text-lg text-gray-600 mb-1">
                    {selectedMarker.gods}
                  </p>
                  <p className="location text-sm sm:text-base md:text-lg text-gray-600 mb-1">
                    {selectedMarker.location}
                  </p>
                  <span 
                    className="details-link text-blue-500 underline text-sm sm:text-base md:text-lg cursor-pointer"
                    onClick={() => handleViewDetails(selectedMarker.listing_id)}
                  >
                    查看详情
                  </span>
                </div>
              </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
}

export default GoogleMapWithNoSSR;

