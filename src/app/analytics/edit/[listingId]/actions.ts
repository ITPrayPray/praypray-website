'use server';

import { createClient } from '@/lib/supabase/server';
import { createServerClient as createAdminSupabaseClient } from '@supabase/ssr'; // For admin tasks like storage
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/database.types'; // Assuming types exist

// --- Types --- 
interface UpdateListingResult {
  success: boolean;
  message: string;
  listingId?: string;
}
interface SelectedServiceData {
  service_id: string;
  service_name?: string; // Name not needed for update
  price: string;
  custom_description: string;
}

// --- Update Action --- 
export async function updateListingAction(
  prevState: UpdateListingResult | undefined,
  formData: FormData
): Promise<UpdateListingResult> {
  const supabase = createClient(); // User context client
  const cookieStore = cookies();
  const supabaseAdmin = createAdminSupabaseClient<Database>( // Admin client
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  // 1. Get User & Listing ID
  const { data: { user } } = await supabase.auth.getUser();
  const listingId = formData.get('listingId') as string;

  if (!user) {
    return { success: false, message: "需要驗證身份。(Authentication required.)" };
  }
  if (!listingId) {
    return { success: false, message: "缺少列表 ID。(Missing listing ID.)" };
  }

  // 2. Authorization: Verify user owns the listing
  const { data: ownerCheck, error: ownerError } = await supabase
    .from('listings')
    .select('owner_id, icon') // Select icon URL for potential deletion
    .eq('listing_id', listingId)
    .single();

  if (ownerError || !ownerCheck) {
     return { success: false, message: "找不到列表或讀取錯誤。(Listing not found or error.)" };
  }
  if (ownerCheck.owner_id !== user.id) {
     return { success: false, message: "您無權編輯此列表。(Unauthorized to edit this listing.)" };
  }
  const oldIconUrl = ownerCheck.icon;

  // 3. Extract Form Data
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const tagIdString = formData.get('tagId') as string | null;
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
  const stateId = formData.get('stateId') as string | null;
  const openingHoursString = formData.get('openingHours') as string | null;
  const religionIdsString = formData.get('religionIds') as string | null;
  const godIdsString = formData.get('godIds') as string | null;
  const listingServicesJson = formData.get('listingServicesData') as string | null;
  const iconFile = formData.get('iconFile') as File | null;

   // 4. Basic Validation (Add more as needed)
   if (!name || !description || !tagIdString || !location || !stateId) {
      return { success: false, message: "缺少必填字段。(Missing required fields.)" };
   }
   if (tagIdString === '2' && (!phone || !email || !listingServicesJson || JSON.parse(listingServicesJson).length === 0)) {
       return { success: false, message: "專業服務類型需要電話、電子郵件和至少一項服務。(PROSERVICE requires phone, email, and at least one service.)" };
   }
   if (tagIdString === '1' && (!godIdsString || godIdsString.length === 0)) {
       return { success: false, message: "寺廟類型需要至少一個主要神祇。(TEMPLE requires at least one main god.)" };
   }

  // 5. Handle Icon Upload/Deletion
  let newIconUrl: string | null | undefined = undefined; // undefined means no change
  if (iconFile && iconFile.size > 0) {
      const fileExt = iconFile.name.split('.').pop();
      const fileName = `public/${Date.now()}.${fileExt}`; // Use timestamp for uniqueness
      const iconsBucket = 'listing-icons'; 

      try {
          // Delete old icon first (if exists)
          if (oldIconUrl) {
              const oldPath = oldIconUrl.substring(oldIconUrl.indexOf(iconsBucket) + iconsBucket.length + 1);
              console.log("Attempting to delete old icon:", oldPath);
              await supabaseAdmin.storage.from(iconsBucket).remove([oldPath]);
          }
          // Upload new icon
          const { error: uploadError } = await supabaseAdmin.storage.from(iconsBucket).upload(fileName, iconFile);
          if (uploadError) throw uploadError;
          // Get new public URL
          const { data: urlData } = supabaseAdmin.storage.from(iconsBucket).getPublicUrl(fileName);
          newIconUrl = urlData?.publicUrl ?? null;
          if (!newIconUrl) throw new Error('Failed to get new icon public URL');
      } catch (error: any) {
          console.error('Icon Update Error:', error);
          return { success: false, message: `圖標更新失敗: ${error.message}` };
      }
  } // If no new iconFile, newIconUrl remains undefined

  // 6. Prepare Update Data
   let parsedOpeningHours: Record<string, string> | null = null;
   if (openingHoursString) { try { parsedOpeningHours = JSON.parse(openingHoursString); } catch(e) { /* handle */ } }

   const listingUpdateData = {
      listing_name: name,
      description: description,
      tag_id: parseInt(tagIdString, 10),
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
      opening_hours: parsedOpeningHours,
      // Conditionally include icon only if it was updated
      ...(newIconUrl !== undefined && { icon: newIconUrl }), 
      updated_at: new Date().toISOString(), // Set updated timestamp
   };

  // 7. Update Listings Table
  const { error: updateError } = await supabase
    .from('listings')
    .update(listingUpdateData)
    .eq('listing_id', listingId)
    .eq('owner_id', user.id);

   if (updateError) {
       console.error('Listing Update Error:', updateError);
       return { success: false, message: `更新列表失敗: ${updateError.message}` };
   }

  // 8. Update Linking Tables (Delete old, Insert new)
  try {
      // Delete existing related data first
      await Promise.all([
          supabaseAdmin.from('listing_religions').delete().eq('listing_id', listingId),
          supabaseAdmin.from('listing_gods').delete().eq('listing_id', listingId),
          supabaseAdmin.from('listing_services').delete().eq('listing_id', listingId)
      ]);

      // Insert new relations
      const religionIds = religionIdsString ? religionIdsString.split(',').filter(id => id) : [];
      const godIds = godIdsString ? godIdsString.split(',').filter(id => id) : [];
      const services: SelectedServiceData[] = listingServicesJson ? JSON.parse(listingServicesJson) : [];

      if (religionIds.length > 0) {
          const religionData = religionIds.map(rId => ({ listing_id: listingId, religion_id: rId }));
          await supabaseAdmin.from('listing_religions').insert(religionData);
      }
      if (godIds.length > 0) {
          const godData = godIds.map(gId => ({ listing_id: listingId, god_id: gId }));
          await supabaseAdmin.from('listing_gods').insert(godData);
      }
      if (services.length > 0) {
         const serviceData = services.map(s => ({
             listing_id: listingId,
             service_id: s.service_id,
             price: s.price ? parseFloat(s.price) : null,
             custom_description: s.custom_description || null
         }));
         await supabaseAdmin.from('listing_services').insert(serviceData);
      }
  } catch (linkError: any) {
       console.error("Error updating linking tables:", linkError);
       // Return success but maybe with a warning that relations might be inconsistent?
       // return { success: true, message: "列表已更新，但關聯更新失敗。", listingId };
       return { success: false, message: `更新關聯數據失敗: ${linkError.message}` }; // Treat as failure for now
  }

  // 9. Revalidate & Redirect
  revalidatePath('/analytics');
  revalidatePath(`/detail/${listingId}`);

   try {
     redirect(`/analytics`); // Or redirect to detail page: `/detail/${listingId}`
   } catch (error: any) {
       if (error.message !== 'NEXT_REDIRECT') { console.error("Redirect error:", error); }
       // Assume success if redirect is attempted
       return { success: true, message: "列表更新成功。", listingId };
   }

   // return { success: true, message: "列表更新成功。", listingId };
} 