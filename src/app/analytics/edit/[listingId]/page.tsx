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

    // --> Associated data fetching and formatting inside this block <--
    try {
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
            // Even if associated data fails, we might still want to return the main listing data
            // Or decide to return null based on how critical this associated data is
        }

        // Format Data for the Form - Explicitly map fields
        // Now TypeScript knows 'listing' is valid here
        const formattedData: ListingFormData = {
            listing_id: (listing as ListingRow).listing_id, // Use type assertion
            listing_name: (listing as ListingRow).listing_name ?? '',
            description: (listing as ListingRow).description ?? '',
            location: (listing as ListingRow).location ?? '',
            lat: (listing as ListingRow).lat,
            lng: (listing as ListingRow).lng,
            phone: (listing as ListingRow).phone ?? '',
            email: (listing as ListingRow).email ?? '',
            website: (listing as ListingRow).website ?? '',
            facebook: (listing as ListingRow).facebook ?? '',
            instagram: (listing as ListingRow).instagram ?? '',
            whatsapp: (listing as ListingRow).whatsapp ?? '',
            xiaohongshu: (listing as ListingRow).xiaohongshu ?? '',
            google_map_link: (listing as ListingRow).google_map_link ?? '',
            state_id: (listing as ListingRow).state_id ?? '', 
            tag_id: (listing as ListingRow).tag_id?.toString() ?? '', 
            icon: (listing as ListingRow).icon,
            opening_hours: (listing as ListingRow).opening_hours as Record<string, string> | null,
            selected_religions: religionsData?.map(r => r.religion_id) ?? [],
            selected_gods: godsData?.map(g => g.god_id) ?? [],
            selected_services_data: servicesData?.map(s => ({
                service_id: s.service_id,
                service_name: s.service?.service_name ?? 'Unknown',
                price: s.price?.toString() ?? '', 
                custom_description: s.custom_description ?? '',
            })) ?? [],
        };

        return formattedData;

    } catch (error) {
        console.error('Error during associated data fetch or formatting:', error);
        return null; // Return null if anything fails after finding the main listing
    }
}

// Edit Page Component
export default async function EditListingPage({ params }: { params: { listingId: string } }) {
  const listingId = params.listingId;
  const initialData = await getListingDataForEdit(listingId);

  if (!initialData || !initialData.tag_id) { // Also check if tag_id is present
    notFound();
  }

  // ---> Determine listingType from initialData.tag_id <--- 
  const listingType = initialData.tag_id === '1' ? 'TEMPLE' : initialData.tag_id === '2' ? 'PROSERVICE' : undefined;

  if (!listingType) {
    // Handle cases where tag_id is missing or invalid from the fetched data
    console.error(`Invalid or missing tag_id: ${initialData.tag_id} for listing ${listingId}`);
    notFound(); // Or show an error message
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
                    listingType={listingType} // ---> Pass the determined listingType <--- 
                />
            </CardContent>
        </Card>
     </div>
  );
} 