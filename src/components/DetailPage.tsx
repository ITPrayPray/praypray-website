// src/components/DetailPage.tsx
'use client';
import React from 'react';
import Head from 'next/head';
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
  image_urls?: string[] | null;
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
    images?: string[] | null;
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
    
    {/* Additional details skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>

    {/* Map skeleton */}
    <Skeleton className="h-[300px] md:h-[350px] lg:h-[400px] w-full rounded-md" />

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

          {/* Map and Details Section Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Additional Details */}
            <section id={sectionIds.details} className="mb-10 md:mb-0" aria-label="Additional details">
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

            {/* Map Section */}
            {(data.lat && data.lng) && (
              <section id={sectionIds.location} className="mb-10 md:mb-0" aria-label="Location">
                <div className="rounded-xl overflow-hidden shadow-sm border border-border h-[300px] md:h-[350px] lg:h-[400px]">
                  <LocationMap 
                    lat={data.lat} 
                    lng={data.lng} 
                    name={data.listing_name}
                    address={data.address || data.location || ''}
                  />
                </div>
              </section>
            )}
          </div>

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