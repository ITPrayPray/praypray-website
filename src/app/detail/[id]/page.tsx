// /src/app/detail/[id]/page.tsx
import React from 'react';
// import { headers } from 'next/headers'; // Removed unused import
import DetailPage, { DetailData } from '../../../components/DetailPage';
import ErrorDisplay from '../../../components/ErrorDisplay';
import { createClient } from '@supabase/supabase-js';

// Define Post type for clarity
interface Post {
  comment_id: string;
  title: string; // Added title based on mapping
  content: string;
  created_at: string;
  user_id: string;
  listing_id: string;
}

interface OperatingHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// Initialize Supabase client directly here for server-side fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Ensure environment variables are available
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Key is missing!');
  // Handle the error appropriately in a real app, maybe throw?
}
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Fetch data directly from Supabase
async function fetchDetailDirectly(id: string): Promise<DetailData> {
  try {
    console.log(`Fetching detail directly for ID: ${id}`);

    // Fetch listing data
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(`
        listing_id,
        listing_name,
        location,
        description,
        lat,
        lng,
        phone,
        email,
        website,
        facebook,
        instagram,
        whatsapp,
        icon,
        google_map_link,
        image_urls,
        state:state_id(state_name),
        religions:listing_religions(
          religion:religion_id(religion_name)
        ),
        gods:listing_gods(
          god:god_id(god_name)
        ),
        tag:tag_id(
          tag_name,
          id
        ),
        opening_hours,
        owner_id
      `)
      .eq('listing_id', id)
      .maybeSingle(); // Use maybeSingle to handle case where listing might not be found

    if (listingError) {
      console.error('Error fetching listing detail directly:', listingError);
      throw new Error(`無法取得詳細資料: ${listingError.message}`);
    }
    if (!listingData) {
        throw new Error(`找不到 ID 為 ${id} 的列表`);
    }

    // Fetch services data using simpler relation syntax and CORRECT column name
    const { data: servicesData, error: servicesError } = await supabase
      .from('listing_services')
      .select(`
         id,
         price,
         custom_description,
         services ( service_name, description ) // Use the correct column name 'description'
      `)
      .eq('listing_id', id);

    // Log the raw services data for debugging
    console.log("Raw servicesData fetched (Corrected Column):", JSON.stringify(servicesData, null, 2));
    console.log("Services fetch error (Corrected Column):", servicesError);

    if (servicesError) {
      console.error('Error fetching services directly:', servicesError);
      // Continue without services if error occurs
    }

    // Fetch comments data (for posts)
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        comment_id,
        content,
        created_at,
        user_id,
        listing_id
      `)
      .eq('listing_id', id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching posts directly:', commentsError);
      // Continue without posts if error occurs
    }

    // Filter comments to get owner posts
    let ownerPosts: Post[] = []; // Explicitly type ownerPosts
    if (listingData.owner_id && commentsData) {
        ownerPosts = commentsData
          .filter(post => post.user_id === listingData.owner_id)
          .map(post => ({
            ...post,
            title: post.content // Use content as title (or potentially derive differently)
          }));
    }

    // Combine data, ensuring types match DetailData
    const combinedData: DetailData = {
      listing_id: listingData.listing_id,
      listing_name: listingData.listing_name,
      description: listingData.description,
      image_urls: listingData.image_urls,
      whatsapp: listingData.whatsapp,
      phone: listingData.phone,
      email: listingData.email,
      website: listingData.website,
      location: listingData.location,
      lat: listingData.lat,
      lng: listingData.lng,
      google_map_link: listingData.google_map_link,
      // Correctly map state: check if state exists and is an object
      state: listingData.state && typeof listingData.state === 'object' && !Array.isArray(listingData.state) 
             ? listingData.state 
             : undefined,
      // Correctly map services based on the corrected query structure
      services: servicesData
        ?.filter(s => s && typeof s === 'object' && 'id' in s) // Filter out potential errors/nulls
        .map((s, index) => {
          console.log(`Mapping service item ${index}:`, JSON.stringify(s, null, 2));
          
          // Update the interface to expect 'description' instead of 'service_description'
          interface ValidServiceItem {
            id: string | number; 
            price?: string | number | null;
            custom_description?: string | null;
            services: { 
              service_name: string;
              description?: string | null; // Changed from service_description
            } | null; 
          }

          const validServiceItem = s as ValidServiceItem;
          
          const serviceDetail = validServiceItem.services; 
                                
          console.log(`  - Extracted serviceDetail ${index}:`, JSON.stringify(serviceDetail, null, 2));
          return {
            price: validServiceItem.price,
            custom_description: validServiceItem.custom_description,
            // Access properties using the correct field name 'description'
            service: serviceDetail 
                     ? { 
                         service_name: serviceDetail.service_name, 
                         service_description: serviceDetail.description ?? undefined // Use .description here
                       } 
                     : { service_name: '未知服務', service_description: undefined } 
          };
        }) || [],
      // Correctly map religions: access nested object directly
      religions: listingData.religions?.map(r => ({
        // Check if r.religion exists and is an object
        religion: r.religion && typeof r.religion === 'object' && !Array.isArray(r.religion) 
                  ? r.religion 
                  : { religion_name: '未知宗教' }
      })) || [],
      // Correctly map gods: access nested object directly
      gods: listingData.gods?.map(g => ({
        // Check if g.god exists and is an object
        god: g.god && typeof g.god === 'object' && !Array.isArray(g.god) 
             ? g.god 
             : { god_name: '未知神祇' } // god_description is already optional in DetailData
      })) || [],
      // Correctly map tag: check if tag exists and is an object
      tag: listingData.tag && typeof listingData.tag === 'object' && !Array.isArray(listingData.tag) 
           ? listingData.tag 
           : undefined,
      icon: listingData.icon,
      opening_hours: listingData.opening_hours,
      posts: ownerPosts,
      reviews: [], // Placeholder for reviews
      facebook: listingData.facebook,
      instagram: listingData.instagram,
    };

    console.log("Received data directly:", combinedData);
    return combinedData;

  } catch (error) {
    console.error("Error in fetchDetailDirectly:", error);
    throw error;
  }
}

// Page component now uses fetchDetailDirectly
export default async function Page({ params }: { params: { id: string } }) {
  try {
    console.log("Detail page for ID:", params.id);
    // Call the direct fetching function
    const data = await fetchDetailDirectly(params.id);

    // Keep the opening hours processing logic
    const operatingHours: OperatingHour[] = data.opening_hours ? Object.entries(data.opening_hours).map(([day, hours]) => {
       // Add safety check for hours format
      if (typeof hours !== 'string' || !hours.includes('-')) {
        console.warn(`Invalid opening hours format for day ${day}: ${hours}`);
        return {
          day,
          open_time: '',
          close_time: '',
          is_closed: true // Assume closed if format is wrong
        };
      }
      const [open_time, close_time] = hours.split('-');
      return {
        day,
        open_time: open_time.trim(),
        close_time: close_time.trim(),
        is_closed: false
      };
    }) : [];
    
    console.log("Operating Hours Data:", {
      fromAPI: data.opening_hours,
      processed: operatingHours
    });

    return <DetailPage data={data} operatingHours={operatingHours} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Pass the specific error message to ErrorDisplay
    return <ErrorDisplay message={`獲取資料失敗: ${errorMessage}`} />;
  }
}