"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, OverlayView } from "@react-google-maps/api";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";
import Slider from "react-slick";
import Link from 'next/link';
import dynamic from 'next/dynamic';
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

// Use a client-side only component with dynamic import to handle Google Maps
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
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState<number>(0);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  const onMapClick = () => {
    setSelectedMarker(null);
  };

  // 轮播设置
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    lazyLoad: 'ondemand',
    arrows: false, // 隐藏左右箭头
  };

  useEffect(() => {
    const updateMapWidth = () => {
      if (mapContainerRef.current) {
        setMapWidth(mapContainerRef.current.offsetWidth);
      }
    };

    updateMapWidth();

    window.addEventListener('resize', updateMapWidth);

    return () => {
      window.removeEventListener('resize', updateMapWidth);
    };
  }, []);

  // Check if the Google object is available
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setScriptLoaded(true);
      }
    };

    // Check if already loaded
    checkGoogleMapsLoaded();

    // If not already loaded, set up an interval to check
    const interval = setInterval(() => {
      if (window.google && window.google.maps) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={mapContainerRef} style={containerStyle}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        onError={() => console.error("Failed to load Google Maps script.")}
        onLoad={() => setScriptLoaded(true)}
      >
        {scriptLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={markers.length > 0 ? markers[0] : defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={onMapClick}
          >
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
                  scaledSize: { width: 24, height: 24 },
                }}
                onClick={() => {
                  setSelectedMarker(marker);
                }}
              />
            ))}
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
                              <img
                                src={url}
                                alt={`Image ${index + 1}`}
                                className="w-full h-24 sm:h-32 md:h-32 lg:h-40 object-cover"
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
                      <Link 
                        href={`/detail/${encodeURIComponent(String(selectedMarker.listing_id))}`}
                      >
                        <span className="details-link text-blue-500 underline text-sm sm:text-base md:text-lg">
                          查看详情
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </OverlayView>
            )}
          </GoogleMap>
        )}
      </LoadScript>
    </div>
  );
}

// Export the non-SSR version as default
export default GoogleMapWithNoSSR;
