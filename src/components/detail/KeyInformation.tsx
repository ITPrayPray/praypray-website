'use client';

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Heart, MapPin, Star } from 'lucide-react';
import { DetailData } from '../DetailPage';
import { cn } from '@/lib/utils';

interface KeyInformationProps {
  name: string;
  type?: string;
  description?: string;
  gods?: DetailData['gods'];
  religions?: DetailData['religions'];
  address?: string;
  state?: string;
}

/**
 * KeyInformation - Displays essential details about the listing
 * Includes: name, type, badges, description, location, and favorite button
 * Features high contrast text and responsive layout
 */
export const KeyInformation: React.FC<KeyInformationProps> = ({
  name,
  type,
  description,
  gods,
  religions,
  address,
  state,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Handle favorite toggle with animation
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, you would save this to the user's preferences
  };

  // Format description for display, truncating if too long
  const descriptionToShow = description || '';
  const shouldTruncate = descriptionToShow.length > 240;
  const truncatedDescription = shouldTruncate && !isDescriptionExpanded 
    ? `${descriptionToShow.substring(0, 240)}...` 
    : descriptionToShow;

  // Get badge color based on listing type
  const getBadgeVariant = (type?: string) => {
    if (!type) return "secondary";
    
    switch (type.toUpperCase()) {
      case 'TEMPLE':
        return "default"; // primary color
      case 'PROSERVICE':
        return "secondary"; // custom color defined in badge.tsx
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Type and Religion Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {type && (
              <Badge variant={getBadgeVariant(type)} className="capitalize font-medium">
                {type.toLowerCase()}
              </Badge>
            )}
            {religions?.map((r, i) => (
              <Badge key={i} variant="outline" className="font-medium text-black border-gray-300">
                {r.religion.religion_name}
              </Badge>
            ))}
          </div>

          {/* Listing Name - High contrast black text */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black">
            {name}
          </h1>

          {/* Deities Information */}
          {gods && gods.length > 0 && (
            <div className="flex flex-wrap items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">
                神祇: {gods.map(g => g.god.god_name).join(', ')}
              </span>
            </div>
          )}

          {/* Address Information with high contrast */}
          {(address || state) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-700 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">
                {[address, state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Favorite Button with Animation */}
        <div className="transition-transform duration-200 hover:scale-105">
          <Button
            onClick={toggleFavorite}
            variant={isFavorite ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-12 w-12 flex-shrink-0 rounded-full shadow-sm", 
              isFavorite 
                ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" 
                : "border-gray-300 hover:border-red-200 hover:text-red-500"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-all duration-300",
                isFavorite ? "fill-current" : ""
              )}
            />
          </Button>
        </div>
      </div>

      {/* Description Section with Read More/Less */}
      {description && (
        <div className="mt-6">
          <p className="text-gray-800 leading-relaxed">
            {truncatedDescription}
          </p>
          
          {shouldTruncate && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-primary font-medium"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {isDescriptionExpanded ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};