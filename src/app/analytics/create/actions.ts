'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'; // <-- Alias user-context client
import { createServerClient as createAdminSupabaseClient } from '@supabase/ssr'; // <-- Import base client for admin
import { cookies } from 'next/headers'; // <-- Need cookies for admin client too
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// IMPORTANT: Use Service Role Key only on the server!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
// DO NOT expose this key to the client-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Interface for the Server Action result
interface CreateListingResult {
  success: boolean;
  message: string;
  listingId?: string;
  shouldRedirect?: boolean; // Add flag for client-side redirect
  redirectUrl?: string; // Add URL for client-side redirect
}

// Interface for data to be inserted into listings table
// (Define expected fields and types, including new ones)
interface ListingInsertData {
  listing_name: string;
  description: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  xiaohongshu?: string | null;
  google_map_link?: string | null;
  state_id: string; // Assuming always required based on validation
  tag_id: number; // Assuming always required based on validation
  icon?: string | null;
  opening_hours?: Record<string, string> | null;
  owner_id: string;
  revenuecat_product_id?: string | null;
  revenuecat_entitlement_id?: string | null;
  subscription_start_date?: string | null; // ISO string or null
  subscription_end_date?: string | null; // ISO string or null
  status: 'PENDING' | 'LIVE';
}

// Define the type for the data coming from the form (for selected services)
interface SelectedServiceData {
  service_id: string;
  service_name: string;
  price: string;
  custom_description: string;
}

export async function createListingAction(
  prevState: CreateListingResult | undefined,
  formData: FormData
): Promise<CreateListingResult> {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("User not authenticated for create action:", userError);
    return { success: false, message: "需要登入才能創建列表。(Authentication required.)" };
  }
  const ownerId = user.id;
  const cookieStore = cookies();
  const supabaseAdmin = createAdminSupabaseClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        cookies: { // Provide dummy cookie handlers for service role client
          get(name: string) { return cookieStore.get(name)?.value; }, // Still useful to read potentially
          set() {}, // Service role doesn't typically set user cookies
          remove() {}, // Service role doesn't typically remove user cookies
        },
        auth: {
            // Prevent admin client from persisting session cookies accidentally
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
      }
  );

  // --- 1. Extract Data from FormData --- 
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string | null;
  const latString = formData.get('lat') as string | null;
  const lngString = formData.get('lng') as string | null;
  const phone = formData.get('phone') as string | null;
  const email = formData.get('email') as string | null;
  const website = formData.get('website') as string | null;
  const facebook = formData.get('facebook') as string | null;
  const instagram = formData.get('instagram') as string | null;
  const whatsapp = formData.get('whatsapp') as string | null;
  const xiaohongshu = formData.get('xiaohongshu') as string | null;
  const googleMapLink = formData.get('googleMapLink') as string | null;
  const stateId = formData.get('stateId') as string | null; // This should be the selected state_id
  const tagIdString = formData.get('tagId') as string | null;
  const openingHoursString = formData.get('openingHours') as string | null;
  const religionIdsString = formData.get('religionIds') as string | null;
  const godIdsString = formData.get('godIds') as string | null;
  const iconFile = formData.get('iconFile') as File | null;
  const listingServicesJson = formData.get('listingServicesData') as string | null; // <-- Extract service data

  // Determine the tag and type
  const tagId = tagIdString ? parseInt(tagIdString, 10) : null;
  const isProService = tagId === 2;
  const finalStatus = 'PENDING'; // Always set to PENDING initially

  // Basic validation (more robust validation needed in production)
  if (!name || !description || !stateId || !tagId) {
    return { 
        success: false, 
        message: "名稱、描述、州/地區和列表類型為必填項。(Name, description, state, and Listing Type are required.)"
    };
  }

  let iconUrl: string | null = null;
  let uploadedIconPath: string | null = null; // Store the path for potential deletion
  const iconsBucket = 'listing-icons'; // Define bucket name here to be accessible in catch blocks

  // --- 2. Upload Icon File (using Admin client if necessary) --- 
  if (iconFile && iconFile.size > 0) {
    const fileExt = iconFile.name.split('.').pop();
    const fileName = `${ownerId}/${Date.now()}.${fileExt}`; // More unique path
    const filePath = `public/${fileName}`;
    uploadedIconPath = filePath; // Store the path

    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(iconsBucket)
        .upload(filePath, iconFile);

      if (uploadError) {
        console.error('Icon Upload Error:', uploadError);
        return { success: false, message: `圖標上傳失敗：${uploadError.message}。(Icon upload failed)` };
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(iconsBucket)
        .getPublicUrl(filePath);
      iconUrl = urlData?.publicUrl ?? null;
       if (!iconUrl) {
         console.error('Error getting public URL for icon');
         // Attempt to delete the uploaded file if URL retrieval fails
         if (uploadedIconPath) {
              console.log("Attempting to delete icon due to URL retrieval failure:", uploadedIconPath);
              await supabaseAdmin.storage.from(iconsBucket).remove([uploadedIconPath]);
         }
         return { success: false, message: "無法獲取圖標 URL。(Could not get icon URL.)" };
       }

    } catch (error) {
      console.error('Icon Upload Exception:', error);
      // Attempt to delete icon on exception
      if (uploadedIconPath) { // Use the stored path
         console.log("Attempting to delete icon due to upload exception:", uploadedIconPath);
         try { await supabaseAdmin.storage.from(iconsBucket).remove([uploadedIconPath]); } catch (delErr) { console.error("Failed to delete icon during cleanup:", delErr); }
      }
      return { success: false, message: "圖標上傳期間發生意外錯誤。(Unexpected error during icon upload.)" };
    }
  } else {
       console.log("No icon file provided or file is empty.");
  }

  // --- 3. Prepare Data for Listings Table --- 
  let parsedOpeningHours: Record<string, string> | null = null;
  if (openingHoursString) {
    try {
      parsedOpeningHours = JSON.parse(openingHoursString);
      // Optional: Add validation for the structure of parsedOpeningHours here
    } catch (e) {
      console.warn('Could not parse opening hours JSON:', openingHoursString, e);
      // Decide how to handle invalid JSON - ignore, return error, etc.
      // For MVP, we might ignore it or return a warning later
    }
  }

  // Use the defined interface for listing data
  const listingData: ListingInsertData = {
    listing_name: name,
    description: description,
    location: location,
    lat: latString ? parseFloat(latString) : null,
    lng: lngString ? parseFloat(lngString) : null,
    phone: phone,
    email: email,
    website: website,
    facebook: facebook,
    instagram: instagram,
    whatsapp: whatsapp,
    xiaohongshu: xiaohongshu,
    google_map_link: googleMapLink,
    state_id: stateId,
    tag_id: tagId,
    icon: iconUrl,
    opening_hours: parsedOpeningHours,
    owner_id: ownerId, // <-- Set owner_id from authenticated user
    status: finalStatus // Set status based on type ('PENDING' or 'LIVE')
  };

  // --- 4. Insert into Listings Table (using user-context client) --- 
  let newListingId: string | null = null;
  try {
    // Filter out null/undefined values before insert
    const dataToInsert = Object.entries(listingData).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
            acc[key as keyof ListingInsertData] = value;
        }
        return acc;
    }, {} as Partial<ListingInsertData>);

    const { data: newListings, error: insertError } = await supabase
      .from('listings')
      .insert(dataToInsert) // Insert filtered data
      .select('listing_id')
      .single();

    if (insertError) {
      console.error('Listing Insert Error:', insertError);
       // Attempt icon deletion
       if (uploadedIconPath) { 
           console.log("Attempting to delete icon due to listing insert failure:", uploadedIconPath);
           await supabaseAdmin.storage.from(iconsBucket).remove([uploadedIconPath]);
       }
      return { success: false, message: `創建列表失敗：${insertError.message}。(Failed to create listing)` };
    }

    if (!newListings?.listing_id) {
        console.error('Listing insert succeeded but no ID returned.');
        if (uploadedIconPath) { /* Attempt deletion */ await supabaseAdmin.storage.from(iconsBucket).remove([uploadedIconPath]); }
        return { success: false, message: "創建列表成功，但無法獲取 ID。(Listing created, but failed to retrieve ID.)" };
    }
    newListingId = newListings.listing_id;
    console.log('Listing created successfully with ID:', newListingId);

  } catch (error) {
    console.error('Listing Insert Exception:', error);
    // Attempt icon deletion
    if (uploadedIconPath) { 
        console.log("Attempting to delete icon due to listing insert exception:", uploadedIconPath);
        try { await supabaseAdmin.storage.from(iconsBucket).remove([uploadedIconPath]); } catch (delErr) { console.error("Failed to delete icon during cleanup:", delErr); }
    }
    return { success: false, message: "創建列表期間發生意外錯誤。(Unexpected error during listing creation.)" };
  }

  // --- 5. Insert into Linking Tables (Religions, Gods, SERVICES) --- 
  // We need the newListingId from step 4

  const religionIds = religionIdsString ? religionIdsString.split(',').map(id => id.trim()).filter(id => id) : [];
  const godIds = godIdsString ? godIdsString.split(',').map(id => id.trim()).filter(id => id) : [];

  if (religionIds.length > 0) {
    const religionData = religionIds.map(rId => ({ listing_id: newListingId, religion_id: rId }));
    const { error: religionError } = await supabaseAdmin.from('listing_religions').insert(religionData);
    if (religionError) {
      console.error('Error inserting into listing_religions:', religionError);
      // NOTE: Listing is created, but relations failed. Handle cleanup or log warning.
    }
  }

  if (godIds.length > 0) {
    const godData = godIds.map(gId => ({ listing_id: newListingId, god_id: gId }));
    const { error: godError } = await supabaseAdmin.from('listing_gods').insert(godData);
    if (godError) {
      console.error('Error inserting into listing_gods:', godError);
      // NOTE: Listing is created, but relations failed. Handle cleanup or log warning.
    }
  }

  // Parse and insert selected services
  if (listingServicesJson && newListingId) {
    try {
      const selectedServices: SelectedServiceData[] = JSON.parse(listingServicesJson);

      if (Array.isArray(selectedServices) && selectedServices.length > 0) {
        const serviceDataToInsert = selectedServices.map(service => ({
          listing_id: newListingId!,
          service_id: service.service_id,
          // Convert price string to number, handle potential errors/empty strings
          price: service.price ? parseFloat(service.price) : null, 
          custom_description: service.custom_description || null // Ensure null if empty
        }));

        // Use admin client if RLS might block user from inserting into linking table
        const { error: serviceInsertError } = await supabaseAdmin
          .from('listing_services')
          .insert(serviceDataToInsert);

        if (serviceInsertError) {
          console.error('Error inserting into listing_services:', serviceInsertError);
          // Decide how critical this is. Maybe return a partial success message?
          // For now, log warning and continue to redirect.
        }
      }
    } catch (e) {
      console.error("Error parsing or inserting listing services data:", e);
      // Log error but proceed for now
    }
  }

  // --- 6. Revalidation and Redirect --- 
  revalidatePath('/analytics');
  if (newListingId) {
    revalidatePath(`/detail/${newListingId}`);
  }

  if (isProService && newListingId) {
    // Generate Paywall Link for PROSERVICE
    const revenueCatPublicId = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_API_KEY; // Use the same env var
    const offeringId = 'PROSERVICE'; // Your offering identifier
    const paywallBaseUrl = 'https://app.revenuecat.com/web-billing'; // Base URL for web billing

    if (!revenueCatPublicId) {
        console.error("RevenueCat Public API Key is not configured for Paywall Link generation.");
        // Return error or handle fallback? For now, return error.
        return { success: false, message: "無法生成付款連結：設定錯誤。", listingId: newListingId };
    }

    const paywallParams = new URLSearchParams({
        app_id: revenueCatPublicId,
        offering_id: offeringId,
        app_user_id: ownerId,
        external_id: newListingId // Pass listing ID
        // Add other parameters if needed (e.g., locale)
    });

    const paywallUrl = `${paywallBaseUrl}?${paywallParams.toString()}`;
    console.log('Generated Paywall URL:', paywallUrl);

    // Return success state with redirect URL for frontend
    return {
        success: true,
        shouldRedirect: true,
        redirectUrl: paywallUrl,
        message: "列表已創建，正在重定向到付款頁面...",
        listingId: newListingId
    };

  } else {
    // TEMPLE or non-PROSERVICE: Redirect directly using server-side redirect
    const successMessage = "列表已成功創建。";
    try {
      redirect(`/analytics`); // This will throw NEXT_REDIRECT
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is expected for TEMPLE type redirects
        return {
          success: true,
          shouldRedirect: false, // No client-side redirect needed
          message: successMessage,
          listingId: newListingId ?? undefined
        };
      }
      console.error("Redirect error for non-pro listing:", error);
      return { success: false, message: `重定向時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}` };
    }
  }

  // Should not be reached
} 