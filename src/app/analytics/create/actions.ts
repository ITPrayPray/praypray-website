'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// IMPORTANT: Use Service Role Key only on the server!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
// DO NOT expose this key to the client-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface CreateListingResult {
  success: boolean;
  message: string;
  listingId?: string;
}

export async function createListingAction(
  prevState: CreateListingResult | undefined, // For useFormState
  formData: FormData
): Promise<CreateListingResult> {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Server Action Error: Supabase URL or Service Key is missing.");
    return { success: false, message: "伺服器配置錯誤。(Server configuration error.)" };
  }

  // Initialize Supabase client with Service Role Key
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
  const googleMapLink = formData.get('googleMapLink') as string | null;
  const stateId = formData.get('stateId') as string | null; // This should be the selected state_id
  const tagIdString = formData.get('tagId') as string | null;
  const openingHoursString = formData.get('openingHours') as string | null;
  const religionIdsString = formData.get('religionIds') as string | null;
  const godIdsString = formData.get('godIds') as string | null;
  const iconFile = formData.get('iconFile') as File | null;

  // Basic validation (more robust validation needed in production)
  if (!name || !description || !stateId || !tagIdString) {
    return { 
        success: false, 
        message: "名稱、描述、州/地區和標籤 ID 為必填項。(Name, description, state, and Tag ID are required.)" 
    };
  }

  let iconUrl: string | null = null;

  // --- 2. Upload Icon File (if provided) --- 
  if (iconFile && iconFile.size > 0) {
    const fileExt = iconFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`; // Store in a 'public' folder within the bucket
    const iconsBucket = 'listing-icons'; // Replace with your actual bucket name

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
         // Decide if this is critical. Maybe proceed without icon?
         // For now, let's treat it as an error. 
         return { success: false, message: "無法獲取圖標 URL。(Could not get icon URL.)" };
       }

    } catch (error) {
      console.error('Icon Upload Exception:', error);
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

  const listingData = {
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
    google_map_link: googleMapLink,
    state_id: stateId,
    tag_id: tagIdString ? parseInt(tagIdString, 10) : null,
    icon: iconUrl,
    opening_hours: parsedOpeningHours,
    // TODO: Get actual owner_id from user session (e.g., using cookies or Supabase auth helper)
    // owner_id: 'YOUR_LOGGED_IN_USER_ID'
  };

  // --- 4. Insert into Listings Table --- 
  let newListingId: string | null = null;
  try {
    const { data: newListings, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert(listingData)
      .select('listing_id') // Select the ID of the new row
      .single(); // Expect only one row back

    if (insertError) {
      console.error('Listing Insert Error:', insertError);
       // TODO: Consider deleting the uploaded icon if insert fails
      return { success: false, message: `創建列表失敗：${insertError.message}。(Failed to create listing)` };
    }

    if (!newListings?.listing_id) {
        console.error('Listing insert succeeded but no ID returned.');
        return { success: false, message: "創建列表成功，但無法獲取 ID。(Listing created, but failed to retrieve ID.)" };
    }
    newListingId = newListings.listing_id;
    console.log('Listing created successfully with ID:', newListingId);

  } catch (error) {
    console.error('Listing Insert Exception:', error);
    return { success: false, message: "創建列表期間發生意外錯誤。(Unexpected error during listing creation.)" };
  }

  // --- 5. Insert into Linking Tables (Religions, Gods) --- 
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

  // --- 6. Revalidation and Redirect --- 
  revalidatePath('/analytics');
  if (newListingId) {
    revalidatePath(`/detail/${newListingId}`);
  }

  try {
    redirect(`/analytics`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
      console.error("Redirect error:", error);
      return { success: false, message: `重定向失敗：${error.message}` };
    }
    return { 
        success: true, 
        message: "列表創建成功。(Listing created successfully.)", 
        listingId: newListingId ?? undefined
    };
  }

  // Should technically not be reached due to redirect throwing
  // return { 
  //   success: true, 
  //   message: "列表創建成功。(Listing created successfully.)", 
  //   listingId: newListingId ?? undefined 
  // };
} 