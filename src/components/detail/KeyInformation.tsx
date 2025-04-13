'use client';

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Heart, MapPin, Star, Phone, Mail, Link, Facebook, Instagram, ImageIcon } from 'lucide-react';
import { DetailData } from '../DetailPage';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface KeyInformationProps {
  name: string;
  type?: string;
  description?: string;
  gods?: DetailData['gods'];
  religions?: DetailData['religions'];
  address?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  xiaohongshu?: string | null;
  icon?: string;
  tag?: { tag_name: string; id: number };
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
  phone,
  email,
  website,
  facebook,
  instagram,
  whatsapp,
  xiaohongshu,
  icon,
  tag,
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

  const displayGods = gods?.map(g => g.god?.god_name).filter(Boolean).join(', ') || '-';
  const displayReligions = religions?.map(r => r.religion?.religion_name).filter(Boolean).join(', ') || '-';
  const displayAddress = [address, state].filter(Boolean).join(', ');

  return (
    <div className="rounded-xl">
      {(() => {
        console.log('KeyInformation props:', {
          phone,
          email
        });
        return null;
      })()}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-3 flex-1">
          {/* Icon Image */}
          <div className="mb-4">
            {icon ? (
              <div>
                <Image
                  src={icon}
                  alt={`${name} icon`}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center bg-muted/30">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-[12px] text-muted-foreground">
                  待持有人提供 (To be provided by the listing owner)
                </span>
              </div>
            )}
          </div>

          {/* Tag Badge */}
          {tag && (
            <div className="mb-2">
              <Badge 
                variant="default"
                className="rounded-none text-[14px]"
              >
                {tag.tag_name}
              </Badge>
            </div>
          )}

          {/* Type and Religion Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {type && (
              <Badge variant={getBadgeVariant(type)} className="capitalize text-[11px]">
                {type.toLowerCase()}
              </Badge>
            )}
            {displayReligions !== '-' && (
              <Badge variant="outline" className="text-[14px] border-border">
                {displayReligions}
              </Badge>
            )}
          </div>

          {/* Listing Name */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {name}
          </h1>

          {/* Deities Information */}
          {gods && gods.length > 0 && (
            <div className="flex flex-wrap items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-[14px]">
                神祇: {displayGods}
              </span>
            </div>
          )}

          {/* Address Information */}
          {(address || state) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-[14px]">
                {displayAddress}
              </span>
            </div>
          )}

          {/* Phone Information */}
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <span className={cn("text-[14px]", !phone && "text-muted-foreground")}>
              {phone || "待持有人提供 (To be provided by the listing owner)"}
            </span>
          </div>

          {/* Email Information */}
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <span className={cn("text-[14px]", !email && "text-muted-foreground")}>
              {email || "待持有人提供 (To be provided by the listing owner)"}
            </span>
          </div>

          {/* Website Information */}
          <div className="flex items-start gap-2">
            <Link className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <span className={cn("text-[14px]", !website && "text-muted-foreground")}>
              {website || "待持有人提供 (To be provided by the listing owner)"}
            </span>
          </div>
        </div>

        {/* Favorite and Social Media Buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite Button */}
          <Button
            onClick={toggleFavorite}
            variant={isFavorite ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full", 
              isFavorite 
                ? "bg-destructive hover:bg-destructive/90 border-destructive text-destructive-foreground" 
                : "border-border hover:border-destructive/50 hover:text-destructive"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-300",
                isFavorite ? "fill-current" : ""
              )}
            />
          </Button>

          {/* Facebook Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full",
              !facebook && "opacity-50 cursor-not-allowed"
            )}
            asChild={!!facebook}
            disabled={!facebook}
          >
            {facebook ? (
              <a href={facebook} target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4" />
              </a>
            ) : (
              <Facebook className="h-4 w-4" />
            )}
          </Button>

          {/* Instagram Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full",
              !instagram && "opacity-50 cursor-not-allowed"
            )}
            asChild={!!instagram}
            disabled={!instagram}
          >
            {instagram ? (
              <a href={`https://www.instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
              </a>
            ) : (
              <Instagram className="h-4 w-4" />
            )}
          </Button>

          {/* Xiaohongshu Button */}
          {xiaohongshu && (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 flex-shrink-0 rounded-full",
                !xiaohongshu && "opacity-50 cursor-not-allowed"
              )}
              asChild={!!xiaohongshu}
              disabled={!xiaohongshu}
            >
              <a 
                href={xiaohongshu} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Xiaohongshu" 
                className="text-gray-500 hover:text-red-600 font-semibold flex items-center justify-center h-5 w-5"
                title="小红书 (Xiaohongshu)"
              >
                <span className="text-sm leading-none">紅</span>
              </a>
            </Button>
          )}

          {/* WhatsApp Button */}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 rounded-full",
              !whatsapp && "opacity-50 cursor-not-allowed"
            )}
            asChild={!!whatsapp}
            disabled={!whatsapp}
          >
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4" />
              </a>
            ) : (
              <Phone className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Description Section with Read More/Less */}
      {description && (
        <div className="mt-6">
          <p className="text-[14px] leading-relaxed">
            {truncatedDescription}
          </p>
          
          {shouldTruncate && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-[14px]"
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