// src/components/DetailPage.tsx
'use client';
import React from 'react';
import Head from 'next/head';
import { PhotoCarousel } from './detail/PhotoCarousel';
import { KeyInformation } from './detail/KeyInformation';
import { LocationMap } from './detail/LocationMap';
import { AdditionalDetails } from './detail/AdditionalDetails';
import { ReviewSection } from './detail/ReviewSection';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { Skeleton } from './ui/skeleton';
import { BackButton } from './ui/BackButton';
import { Separator } from './ui/separator';
import { ScrollToTopButton } from './ui/ScrollToTopButton';

export interface DetailData {
  listing_id?: string;
  listing_name: string;
  listing_type?: 'TEMPLE' | 'PROSERVICE' | string;
  description?: string;
  image_urls?: string[];
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
  address?: string;
  lat?: number;
  lng?: number;
  state?: { state_name: string };
  services?: Array<{ service: { service_name: string; service_description?: string } }>;
  religions?: Array<{ religion: { religion_name: string } }>;
  gods?: Array<{ god: { god_name: string; god_description?: string } }>;
  tag?: { tag_name: string };
  operating_hours?: Array<{
    day: string;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
  reviews?: Array<{
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
    user_avatar?: string;
  }>;
}

interface DetailPageProps {
  data?: DetailData;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Skeleton placeholder shown during loading state
 * Uses consistent spacing and sizing to match the actual content
 */
const DetailPageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    {/* Hero section skeleton */}
    <div className="relative w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        <Skeleton className="aspect-[4/3] w-full rounded-xl md:col-span-2" />
        <div className="hidden md:grid grid-rows-3 gap-2 md:gap-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        </div>
      </div>
    </div>
    
    {/* Key information skeleton */}
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
    
    {/* Map skeleton */}
    <Skeleton className="h-80 w-full rounded-xl" />
    
    {/* Additional details skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
    
    {/* Reviews skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  </div>
);

/**
 * Main DetailPage component that displays comprehensive information about a listing
 * Optimized for responsive design and follows accessibility best practices
 */
const DetailPage: React.FC<DetailPageProps> = ({ data, isLoading, error }) => {
  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!data) {
    return <ErrorDisplay message="No listing data found" />;
  }

  // Define section IDs for navigation/anchors
  const sectionIds = {
    info: 'listing-info',
    location: 'listing-location',
    details: 'listing-details',
    reviews: 'listing-reviews'
  };

  return (
    <>
      <Head>
        <title>{`${data.listing_name} | Pray Pray`}</title>
        <meta name="description" content={data.description || `Details about ${data.listing_name}`} />
        {/* Open Graph tags for better sharing */}
        <meta property="og:title" content={`${data.listing_name} | Pray Pray`} />
        <meta property="og:description" content={data.description || `Details about ${data.listing_name}`} />
        {data.image_urls?.[0] && <meta property="og:image" content={data.image_urls[0]} />}
        <meta property="og:type" content="website" />
      </Head>

      <div className="bg-background min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton />
          </div>

          {/* Hero Section - Photo Carousel */}
          <section className="mb-10" aria-label="Listing photos">
            <PhotoCarousel images={data.image_urls || []} title={data.listing_name} />
          </section>

          {/* Key Information */}
          <section id={sectionIds.info} className="mb-10" aria-label="Listing information">
            <KeyInformation 
              name={data.listing_name}
              type={data.listing_type}
              description={data.description}
              gods={data.gods}
              religions={data.religions}
              address={data.address || data.location}
              state={data.state?.state_name}
            />
          </section>

          <Separator className="my-10" />

          {/* Map Section */}
          {(data.lat && data.lng) && (
            <section id={sectionIds.location} className="mb-10" aria-label="Location">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Location</h2>
              <div className="rounded-xl overflow-hidden shadow-sm border border-border">
                <LocationMap 
                  lat={data.lat} 
                  lng={data.lng} 
                  name={data.listing_name}
                  address={data.address || data.location || ''}
                />
              </div>
            </section>
          )}

          <Separator className="my-10" />

          {/* Additional Details */}
          <section id={sectionIds.details} className="mb-10" aria-label="Additional details">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Details</h2>
            <AdditionalDetails 
              services={data.services}
              operatingHours={data.operating_hours}
              contactInfo={{
                phone: data.phone,
                whatsapp: data.whatsapp,
                email: data.email,
                website: data.website
              }}
            />
          </section>

          <Separator className="my-10" />

          {/* Reviews Section */}
          <section id={sectionIds.reviews} className="mb-10" aria-label="Reviews">
            <ReviewSection 
              reviews={data.reviews || []} 
              listingId={data.listing_id || ''}
            />
          </section>
          
          <ScrollToTopButton />
        </main>
      </div>
    </>
  );
};

export default DetailPage;