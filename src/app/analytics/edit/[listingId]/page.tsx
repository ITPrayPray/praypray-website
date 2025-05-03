import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingForm, ListingFormData } from '@/components/analytics/ListingForm'; 
import { updateListingAction } from './actions'; // Assuming it will be created here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';
import type { Database } from '@/lib/database.types'; // <-- Import generated types

// Define shorter aliases for generated types if needed
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type ListingRow = Tables<'listings'>;
type ReligionRow = Tables<'listing_religions'>;
type GodRow = Tables<'listing_gods'>;

// Type for the joined service data
interface FetchedServiceJoin {
  service_id: string;
  price: number | null;
  custom_description: string | null;
  service: { service_name: string } | null; // From join
}

// Fetch listing data for editing
async function getListingDataForEdit(listingId: string): Promise<ListingFormData | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch Listing Data - Use generated types
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        *, 
        state:state_id(region_id) 
      `)
      .eq('listing_id', listingId)
      .eq('owner_id', user.id)
      .returns<ListingRow & { state: { region_id: string } | null } | null>() // Use generated type + joined state
      .maybeSingle();

    if (listingError || !listing) {
        console.error('Edit Fetch Error - Listing:', listingError);
        return null;
    }

    // Fetch Associated Data - Use generated types
    const [
        { data: religionsData, error: religionsError },
        { data: godsData, error: godsError },
        { data: servicesData, error: servicesError }
    ] = await Promise.all([
        supabase.from('listing_religions').select('religion_id').eq('listing_id', listingId).returns<Pick<ReligionRow, 'religion_id'>[]>(),
        supabase.from('listing_gods').select('god_id').eq('listing_id', listingId).returns<Pick<GodRow, 'god_id'>[]>(),
        supabase.from('listing_services').select('service_id, price, custom_description, service:services(service_name)').eq('listing_id', listingId).returns<FetchedServiceJoin[]>()
    ]);

    if (religionsError || godsError || servicesError) {
        console.error('Edit Fetch Error - Associated:', { religionsError, godsError, servicesError });
        // Handle potential partial failures if needed
    }

    // Add explicit check for listing before accessing properties
    if (!listing) {
        console.error('Error: Listing became null unexpectedly before formatting.');
        return null; // Should technically not happen due to earlier check, but satisfies TS
    }

    // Format Data for the Form - Explicitly map fields
    const formattedData: ListingFormData = {
        listing_id: listing.listing_id,
        listing_name: listing.listing_name ?? '',
        description: listing.description ?? '',
        location: listing.location ?? '',
        lat: listing.lat,
        lng: listing.lng,
        phone: listing.phone ?? '',
        email: listing.email ?? '',
        website: listing.website ?? '',
        facebook: listing.facebook ?? '',
        instagram: listing.instagram ?? '',
        whatsapp: listing.whatsapp ?? '',
        xiaohongshu: listing.xiaohongshu ?? '',
        google_map_link: listing.google_map_link ?? '',
        state_id: listing.state_id ?? '', 
        tag_id: listing.tag_id?.toString() ?? '', 
        icon: listing.icon,
        opening_hours: listing.opening_hours as Record<string, string> | null, // Cast might still be needed for jsonb
        selected_religions: religionsData?.map(r => r.religion_id) ?? [],
        selected_gods: godsData?.map(g => g.god_id) ?? [],
        selected_services_data: servicesData?.map(s => ({
            service_id: s.service_id,
            service_name: s.service?.service_name ?? 'Unknown',
            price: s.price?.toString() ?? '', 
            custom_description: s.custom_description ?? '',
        })) ?? [],
        // state object with region_id is handled internally by ListingForm now
    };

    return formattedData;
}

// Edit Page Component
export default async function EditListingPage({ params }: { params: { listingId: string } }) {
  const listingId = params.listingId;
  const initialData = await getListingDataForEdit(listingId);

  if (!initialData) {
    // Handle case where listing not found or user doesn't own it
    notFound(); // Or show an access denied message
  }

  return (
     <div className="p-6">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">我的列表</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>編輯: {initialData.listing_name}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <Card>
            <CardHeader>
            <CardTitle>編輯列表 (Edit Listing)</CardTitle>
            <CardDescription>更新您的列表詳細信息。(Update your listing details below.)</CardDescription>
            </CardHeader>
            <CardContent>
                <ListingForm 
                    mode="edit" 
                    initialData={initialData}
                    formActionFn={updateListingAction} 
                />
            </CardContent>
        </Card>
     </div>
  );
} 