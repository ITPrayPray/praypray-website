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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PostsSection } from './detail/PostsSection';

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
  google_map_link?: string;
  state?: { state_name: string };
  services?: Array<{ service: { service_name: string; service_description?: string } }>;
  religions?: Array<{ religion: { religion_name: string } }>;
  gods?: Array<{ god: { god_name: string; god_description?: string } }>;
  tag?: { tag_name: string; id: number };
  icon?: string;
  opening_hours?: Record<string, string>;
  reviews?: Array<{
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    images?: string[] | null;
    created_at: string;
    user_avatar?: string;
  }>;
  posts?: Array<{
    comment_id: string;
    title: string;
    content: string;
    created_at: string;
    user_id: string;
    listing_id: string;
  }>;
  facebook?: string;
  instagram?: string;
  xiaohongshu?: string | null;
}

// 定義我們需要在前端顯示的營業時間結構
interface OperatingHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface DetailPageProps {
  data?: DetailData;
  isLoading?: boolean;
  error?: Error | null;
  operatingHours?: OperatingHour[];
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
const DetailPage: React.FC<DetailPageProps> = ({ data, isLoading, error, operatingHours }) => {
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
        <meta name="description" 
        content={data.description || `Details about ${data.listing_name}`} 
        />
        {/* Open Graph tags for better sharing */}
        <meta 
          property="og:title" 
          content={`${data.listing_name} | Pray Pray`} 
        />
        <meta 
          property="og:description" 
          content={data.description || `Details about ${data.listing_name}`} 
        />
        {data.image_urls?.[0] && 
          <meta property="og:image" content={data.image_urls[0]} 
        />}
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
            {(() => {
              console.log('DetailPage data:', {
                phone: data.phone,
                email: data.email,
                fullData: data
              });
              return null;
            })()}
            <KeyInformation 
              name={data.listing_name}
              type={data.listing_type}
              description={data.description}
              gods={data.gods}
              religions={data.religions}
              address={data.address || data.location}
              state={data.state?.state_name}
              phone={data.phone}
              email={data.email}
              website={data.website}
              facebook={data.facebook}
              instagram={data.instagram}
              whatsapp={data.whatsapp}
              xiaohongshu={data.xiaohongshu}
              icon={data.icon}
              tag={data.tag}
            />
          </section>

          {/* Map and Details Section Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Additional Details */}
            <section 
              id={sectionIds.details} 
              className="mb-10 md:mb-0" 
              aria-label="Additional details"
            >
              <AdditionalDetails 
                services={data.services}
                operatingHours={operatingHours || []}
                contactInfo={{
                  phone: data.phone,
                  whatsapp: data.whatsapp,
                  email: data.email,
                  website: data.website
                }}
              />
            </section>

            {/* Map Section - Keep conditional rendering simple, LocationMap handles logic */}
            {/* We pass lat/lng if they exist, LocationMap decides what to show */}
            <section id={sectionIds.location} className="mb-10 md:mb-0" aria-label="Location">
                <div className="flex flex-col space-y-4">
                  <LocationMap 
                    lat={data.lat}
                    lng={data.lng}
                    google_map_link={data.google_map_link}
                  />
                </div>
            </section>
          </div>

          <Separator className="my-10" />

          {/* Reviews and Posts Tabs */}
          <section id={sectionIds.reviews} className="mb-10">
            <Tabs defaultValue="posts" className="w-full space-y-6">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100/50 p-1 text-muted-foreground">
                <TabsTrigger 
                  value="posts" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:text-gray-900"
                >
                  Latest Updates
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:text-gray-900"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>
              <TabsContent 
                value="posts" 
                className="mt-6 space-y-4"
              >
                <PostsSection 
                  posts={data.posts || []} 
                />
              </TabsContent>
              <TabsContent 
                value="reviews" 
                className="mt-6 space-y-4"
              >
                <ReviewSection 
                  reviews={data.reviews || []} 
                  listingId={data.listing_id || ''}
                />
              </TabsContent>
            </Tabs>
          </section>
          
          <ScrollToTopButton />
        </main>
      </div>
    </>
  );
};

export default DetailPage;