'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';

interface PhotoCarouselProps {
  images: string[];
  title: string;
}

/**
 * PhotoCarousel - An Agoda-like image gallery with a main image and thumbnails
 * Features:
 * - Main large photo with thumbnails on the side
 * - Fullscreen mode with smooth transitions
 * - Responsive design that adapts to different screen sizes
 * - Touch-friendly navigation
 * - Lazy loading for optimal performance
 */
export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fallback image if no images are provided
  const fallbackImage = '/placeholder-image.jpg';
  
  // If no images provided, show a placeholder
  const displayImages = images.length > 0 ? images : [fallbackImage];
  
  // Calculate how many thumbnails to show based on available images
  const maxThumbnails = Math.min(3, displayImages.length - 1);
  
  // Navigate to the previous image
  const prevImage = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };
  
  // Navigate to the next image
  const nextImage = () => {
    setCurrentIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };
  
  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Show "See all photos" instead of thumbnails when there are more than can be displayed
  const showSeeAllButton = displayImages.length > maxThumbnails + 1;
  
  // Render the main layout or fullscreen mode based on state
  return (
    <>
      {/* Regular gallery view */}
      <div className="relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          {/* Main large photo */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg md:col-span-2">
            <Image
              src={displayImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              priority
              className="object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            
            {/* Navigation arrows for larger screens only */}
            <div className="hidden md:block">
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
            </div>
            
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="absolute right-4 bottom-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="View fullscreen"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            {/* Image counter for mobile */}
            <div className="absolute bottom-4 left-4 md:hidden bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {displayImages.length}
            </div>
          </div>
          
          {/* Thumbnails column - only on larger screens */}
          <div className="hidden md:flex md:flex-col md:gap-4">
            {displayImages.slice(0, maxThumbnails).map((image, index) => {
              // Skip the currently displayed image as a thumbnail
              const actualIndex = index >= currentIndex ? index + 1 : index;
              // Check if we've reached the end of the array
              if (actualIndex >= displayImages.length) return null;
              
              return (
                <div
                  key={actualIndex}
                  className={cn(
                    "relative aspect-[4/3] w-full overflow-hidden rounded-lg cursor-pointer transition-opacity duration-300",
                    "hover:opacity-90 focus-within:ring-2 focus-within:ring-primary"
                  )}
                  onClick={() => handleThumbnailClick(actualIndex)}
                >
                  <Image
                    src={displayImages[actualIndex]}
                    alt={`${title} - Thumbnail ${actualIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 0px, 25vw"
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                </div>
              );
            })}
            
            {/* "See all photos" button shown when there are more photos than thumbnails */}
            {showSeeAllButton && (
              <div 
                className="relative aspect-[4/3] w-full overflow-hidden rounded-lg cursor-pointer bg-black/5 hover:bg-black/10 transition-colors duration-300"
                onClick={toggleFullscreen}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <ImageIcon className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium text-center">See all {displayImages.length} photos</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile thumbnails as small dots */}
        <div className="flex justify-center mt-4 md:hidden">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 mx-1 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-primary scale-110" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {/* Fullscreen gallery overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Fullscreen header */}
          <div className="flex items-center justify-between p-4 text-white">
            <h3 className="text-lg font-medium">{title} - {currentIndex + 1}/{displayImages.length}</h3>
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close fullscreen view"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Fullscreen main image */}
          <div className="relative flex-1 w-full">
            <Image
              src={displayImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            
            {/* Fullscreen navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-3 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-3 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          </div>
          
          {/* Thumbnail strip at bottom of fullscreen view */}
          <div className="p-4 bg-black/80">
            <div className="flex space-x-2 overflow-x-auto py-2 px-4 scrollbar-hide">
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative h-16 w-24 flex-shrink-0 rounded overflow-hidden cursor-pointer transition-all duration-300",
                    index === currentIndex 
                      ? "ring-2 ring-primary scale-105" 
                      : "opacity-70 hover:opacity-100"
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};