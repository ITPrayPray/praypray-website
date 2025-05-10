'use server';

import { createClient } from '@/lib/supabase/server';
import { createServerClient as createAdminSupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Database, Json } from '@/lib/database.types';

// Define the expected shape of the action result for creation
interface CreateListingResult {
  success: boolean;
  message: string;
  listingId?: string;
  shouldRedirect?: boolean; // Flag for client-side redirect
  redirectUrl?: string;    // URL for client-side redirect (RevenueCat)
}

// Interface for service data coming from the form
interface SelectedServiceData {
    service_id: string;
    service_name: string;
    price: string; // Keep as string initially
    custom_description: string;
}

// --- Helper Function to Save Listing Data (Internal) ---
async function _saveListingData(
    formData: FormData,
    userId: string,
    tagId: '1' | '2',
    initialStatusOverride?: 'PENDING' | 'ACTIVE' // Allow overriding initial status
): Promise<{ success: boolean; message: string; listingId?: string }> {
    const cookieStore = cookies();
    const supabase = createClient(); // User context client
    const supabaseAdmin = createAdminSupabaseClient<Database>( // Admin client for storage/junction tables
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} },
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // 1. Parse Form Data
    const iconFile = formData.get('iconFile') as File | null;
    const religionIds = (formData.get('religionIds') as string || '').split(',').filter(Boolean);
    const godIds = (formData.get('godIds') as string || '').split(',').filter(Boolean);
    const openingHoursJson = formData.get('openingHours') as string || '{}';
    const listingServicesJson = formData.get('listingServicesData') as string || '[]';
    const listingName = formData.get('name') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;
    const facebook = formData.get('facebook') as string;
    const instagram = formData.get('instagram') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const xiaohongshu = formData.get('xiaohongshu') as string || null;
    const googleMapLink = formData.get('googleMapLink') as string;
    const stateId = formData.get('stateId') as string;

    // Basic validation (add more as needed)
    if (!listingName || !description || !location || !stateId || !tagId) {
        return { success: false, message: '缺少必填字段。(Missing required fields.)' };
    }
    if (tagId === '2' && (!phone || !email)) {
         return { success: false, message: '專業服務列表需要電話和電子郵件。(Pro Service requires phone and email.)' };
    }

    // 2. Upload Icon (if provided)
    let iconUrl: string | null = null;
    if (iconFile && iconFile.size > 0) {
        const iconsBucket = 'listing-icons';
        const iconPath = `${userId}/${Date.now()}_${iconFile.name}`;
        console.log(`Uploading icon to: ${iconPath}`);
        const { data: storageData, error: storageError } = await supabaseAdmin.storage
            .from(iconsBucket)
            .upload(iconPath, iconFile);

        if (storageError) {
            console.error("Icon upload error:", storageError);
            return { success: false, message: `圖標上傳失敗: ${storageError.message}` };
        }
        // Construct public URL
        const { data: urlData } = supabaseAdmin.storage.from(iconsBucket).getPublicUrl(storageData.path);
        iconUrl = urlData?.publicUrl ?? null;
        console.log(`Icon uploaded, URL: ${iconUrl}`);
    }

    // 3. Prepare Listing Data for Insertion
    // Use initialStatusOverride if provided, otherwise determine by tagId
    const statusToSet = initialStatusOverride ?? (tagId === '2' ? 'PENDING_PAYMENT' : 'ACTIVE'); 
    const listingData: Omit<Database['public']['Tables']['listings']['Insert'], 'listing_id' | 'created_at' | 'updated_at'> = {
        owner_id: userId,
        listing_name: listingName,
        description: description,
        location: location,
        lat: latStr ? parseFloat(latStr) : null,
        lng: lngStr ? parseFloat(lngStr) : null,
        phone: phone,
        email: email,
        website: website || null,
        facebook: facebook || null,
        instagram: instagram || null,
        whatsapp: whatsapp || null,
        xiaohongshu: xiaohongshu,
        google_map_link: googleMapLink || null,
        state_id: stateId,
        tag_id: parseInt(tagId), // Ensure tag_id is number if DB expects number
        icon: iconUrl,
        opening_hours: JSON.parse(openingHoursJson) as Json | null,
        status: statusToSet, // Use the determined status
        // Removed services from here, handled via junction table
    };

    // 4. Insert into Listings Table
    console.log(`Inserting listing for user ${userId}, type ${tagId}...`);
    const { data: newListing, error: insertError } = await supabase
        .from('listings')
        .insert(listingData)
        .select('listing_id')
        .single();

    if (insertError || !newListing?.listing_id) {
        console.error('Error inserting listing:', insertError);
        // Attempt to clean up uploaded icon if insert fails
        if (iconUrl) {
             try {
                 const iconsBucket = 'listing-icons';
                 const pathStartIndex = iconUrl.indexOf(iconsBucket + '/public/');
                 if (pathStartIndex !== -1) {
                    const iconPathToDelete = iconUrl.substring(pathStartIndex + iconsBucket.length + 1);
                    await supabaseAdmin.storage.from(iconsBucket).remove([iconPathToDelete]);
                    console.log("Cleaned up uploaded icon after insert error.");
                 }
             } catch (cleanupError) {
                 console.error("Error cleaning up icon:", cleanupError);
             }
        }
        return { success: false, message: `創建列表時出錯: ${insertError?.message ?? 'Unknown error'}` };
    }
    const newListingId = newListing.listing_id;
    console.log(`Listing ${newListingId} created successfully.`);

    // 5. Insert into Junction Tables (Religions, Gods, Services)
    try {
        const religionsToInsert = religionIds.map(id => ({ listing_id: newListingId, religion_id: id }));
        const godsToInsert = godIds.map(id => ({ listing_id: newListingId, god_id: id }));
        const servicesData: SelectedServiceData[] = JSON.parse(listingServicesJson);
        const servicesToInsert = servicesData.map(s => {
            const priceValue = s.price ? parseFloat(s.price) : NaN; // Attempt to parse
            return {
                listing_id: newListingId,
                service_id: s.service_id,
                price: !isNaN(priceValue) ? priceValue : null, // Use null if parsing failed or empty
                custom_description: s.custom_description || null
            };
        });

        // Use admin client if RLS prevents direct user inserts, otherwise user client is fine
        const insertClient = supabaseAdmin; // Or supabase if RLS allows

        const results = await Promise.allSettled([
            religionsToInsert.length > 0 ? insertClient.from('listing_religions').insert(religionsToInsert) : Promise.resolve(),
            godsToInsert.length > 0 ? insertClient.from('listing_gods').insert(godsToInsert) : Promise.resolve(),
            servicesToInsert.length > 0 ? insertClient.from('listing_services').insert(servicesToInsert) : Promise.resolve(),
        ]);

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Error inserting into junction table ${index}:`, result.reason);
                // Decide if this should rollback or just warn
            }
        });
         console.log(`Junction table data inserted for listing ${newListingId}.`);

    } catch (junctionError: unknown) {
        console.error(`Error preparing/inserting junction data for ${newListingId}:`, junctionError);
        // Consider rollback? For now, return error but listing exists.
        return { success: false, message: `列表已創建，但關聯數據儲存失敗。(Listing created, but linking data failed.)`, listingId: newListingId };
    }

    return { success: true, message: "數據儲存成功。(Data saved successfully.)", listingId: newListingId };
}


// --- Create TEMPLE Server Action ---
export async function createTempleListingAction(
    prevState: CreateListingResult | undefined,
    formData: FormData
): Promise<CreateListingResult> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: '用戶未驗證。(User not authenticated.)' };
    }

    console.log("Executing createTempleListingAction...");
    const result = await _saveListingData(formData, user.id, '1'); // Pass tagId '1'

    if (result.success && result.listingId) {
        revalidatePath('/analytics');
        revalidatePath('/explorer'); // Also revalidate explorer/public pages?
        return {
            success: true,
            message: '廟宇列表已成功創建！(Temple listing created successfully!)',
            listingId: result.listingId,
            shouldRedirect: false // No redirect for temples
        };
    } else {
        return { success: false, message: result.message };
    }
}

// --- Create PROSERVICE Server Action (Modified) ---
export async function createProserviceListingAction(
    prevState: CreateListingResult | undefined,
    formData: FormData
): Promise<CreateListingResult> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: '用戶未驗證。(User not authenticated.)' };
    }

    console.log("PROSERVICE_ACTION: Executing for user:", user.id);

    const YOUR_PROSERVICE_PLAN_ID = 2; 
    const currentDate = new Date().toISOString();

    console.log(`PROSERVICE_ACTION: Checking for active subscription - User: ${user.id}, PlanID: ${YOUR_PROSERVICE_PLAN_ID}, CurrentDate: ${currentDate}`);
    const { data: activeSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, end_date, status, plan_id, profile_id') // Select more fields for logging
        .eq('profile_id', user.id)
        .eq('plan_id', YOUR_PROSERVICE_PLAN_ID)
        .eq('status', 'active')
        .or(`end_date.is.null,end_date.gt.${currentDate}`)
        .maybeSingle();

    if (subError) {
        console.error("PROSERVICE_ACTION: Error fetching user subscription:", subError);
        return { success: false, message: "檢查訂閱狀態時出錯，請稍後再試。(Error checking subscription status.)" };
    }

    // ---> Log the result of the subscription query <--- 
    if (activeSubscription) {
        console.log("PROSERVICE_ACTION: Found active subscription record:", JSON.stringify(activeSubscription));
    } else {
        console.log("PROSERVICE_ACTION: No active subscription record found.");
    }

    if (activeSubscription) {
        console.log("PROSERVICE_ACTION: Active subscription confirmed. Creating listing with PENDING status.");
        const result = await _saveListingData(formData, user.id, '2', 'PENDING');
        if (result.success && result.listingId) {
            revalidatePath('/analytics');
            revalidatePath('/explorer'); 
            return {
                success: true,
                message: '專業服務列表已成功創建！(Pro Service listing created successfully!)',
                listingId: result.listingId,
                shouldRedirect: false 
            };
        } else {
            return { success: false, message: result.message };
        }
    } else {
        console.log("PROSERVICE_ACTION: No active subscription. Proceeding to payment flow.");
        const result = await _saveListingData(formData, user.id, '2');
        if (result.success && result.listingId) {
            const revenueCatPaywallBaseUrl = process.env.REVENUECAT_PROSERVICE_PAYWALL_URL;
            console.log(`PROSERVICE_ACTION: Read REVENUECAT_PROSERVICE_PAYWALL_URL: ${revenueCatPaywallBaseUrl}`);
            if (!revenueCatPaywallBaseUrl) {
                console.error('PROSERVICE_ACTION: RevenueCat Paywall URL is not configured.');
                return { success: false, message: '支付配置錯誤，請聯繫管理員。' };
            }
            try {
                const encodedAppUserId = encodeURIComponent(user.id);
                let paywallUrl = `${revenueCatPaywallBaseUrl}/${encodedAppUserId}`;
                if (user.email) {
                    const encodedEmail = encodeURIComponent(user.email);
                    paywallUrl += (paywallUrl.includes('?') ? '&' : '?') + `email=${encodedEmail}`;
                }
                console.log(`PROSERVICE_ACTION: Constructed Paywall URL for redirect: ${paywallUrl}`);
                revalidatePath('/analytics');
                return {
                    success: true,
                    message: '專業服務列表已創建！正在重定向到付款...',
                    listingId: result.listingId,
                    shouldRedirect: true,
                    redirectUrl: paywallUrl
                };
            } catch (error) {
                console.error("PROSERVICE_ACTION: Error constructing RevenueCat URL:", error);
                return { success: false, message: '準備付款連結時發生內部錯誤。' };
            }
        } else {
            return { success: false, message: result.message };
        }
    }
}

// --- Delete Action Result Type ---
interface DeleteListingResult {
    success: boolean;
    message: string;
}

// --- Delete Server Action ---
export async function deleteListingAction(listingId: string): Promise<DeleteListingResult> {
    if (!listingId) {
        return { success: false, message: "未提供列表 ID。(Listing ID not provided.)" };
    }

    const supabase = createClient(); // User context client
    const cookieStore = cookies();
    const supabaseAdmin = createAdminSupabaseClient<Database>( // Admin client for storage/cascade delete
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value, set: () => {}, remove: () => {} },
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "需要驗證身份。(Authentication required.)" };
    }

    // 2. Authorization & Get Icon URL: Verify user owns the listing
    const { data: ownerCheck, error: ownerError } = await supabase
        .from('listings')
        .select('owner_id, icon') 
        .eq('listing_id', listingId)
        .single(); // Use single to expect one row

    if (ownerError) {
        console.error("Delete Auth Error - Fetching listing:", ownerError);
        return { success: false, message: `查找列表時出錯: ${ownerError.message}` };
    }
    if (!ownerCheck) {
        return { success: false, message: "找不到要刪除的列表。(Listing to delete not found.)" };
    }
    if (ownerCheck.owner_id !== user.id) {
        return { success: false, message: "您無權刪除此列表。(Unauthorized to delete this listing.)" };
    }
    const iconUrlToDelete = ownerCheck.icon;

    console.log(`User ${user.id} authorized to delete listing ${listingId}.`);

    // 3. Delete from Linking Tables (using Admin client to bypass potential RLS)
    // Note: If you have CASCADE DELETE set up in your DB, these might be optional.
    try {
        console.log(`Deleting associated data for listing ${listingId}...`);
        await Promise.all([
            supabaseAdmin.from('listing_religions').delete().eq('listing_id', listingId),
            supabaseAdmin.from('listing_gods').delete().eq('listing_id', listingId),
            supabaseAdmin.from('listing_services').delete().eq('listing_id', listingId),
            // Add other linking tables here if necessary (e.g., comments, listing_hashtags)
            supabaseAdmin.from('comments').delete().eq('listing_id', listingId),
            supabaseAdmin.from('listing_hashtags').delete().eq('listing_id', listingId),
        ]);
        console.log(`Associated data deleted for listing ${listingId}.`);
    } catch (linkError: unknown) {
        console.error(`Error deleting associated data for listing ${listingId}:`, linkError);
        return { success: false, message: `刪除關聯數據時出錯: ${linkError instanceof Error ? linkError.message : String(linkError)}` };
    }

    // 4. Delete Listing Icon from Storage (using Admin client)
    if (iconUrlToDelete) {
        try {
            const iconsBucket = 'listing-icons';
            // Extract path after bucket name
            const pathStartIndex = iconUrlToDelete.indexOf(iconsBucket + '/public/');
            if (pathStartIndex !== -1) {
                const iconPath = iconUrlToDelete.substring(pathStartIndex + iconsBucket.length + 1); 
                console.log(`Attempting to delete icon from storage: ${iconPath}`);
                const { error: storageError } = await supabaseAdmin.storage.from(iconsBucket).remove([iconPath]);
                if (storageError) {
                    console.error("Error deleting icon from storage:", storageError);
                    // Decide if this is critical - maybe proceed but log warning?
                }
            } else {
                 console.warn(`Could not extract path from icon URL: ${iconUrlToDelete}`);
            }
        } catch (storageError: unknown) {
            console.error("Exception during icon deletion:", storageError);
             // Log error but don't block listing deletion maybe?
        }
    }

    // 5. Delete Listing itself (using user context client to respect RLS)
    console.log(`Deleting listing ${listingId} itself...`);
    const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('listing_id', listingId)
        .eq('owner_id', user.id);

    if (deleteError) {
        console.error("Error deleting listing:", deleteError);
        return { success: false, message: `刪除列表時出錯: ${deleteError.message}` };
    }

    console.log(`Listing ${listingId} deleted successfully.`);

    // 6. Revalidate Path
    revalidatePath('/analytics');

    return { success: true, message: "列表已成功刪除。(Listing deleted successfully.)" };
}

// --- Toggle Visibility Action Result Type ---
interface ToggleVisibilityResult {
    success: boolean;
    message: string;
    newStatus?: 'LIVE' | 'HIDING'; // Return the new status
}

// --- Toggle Visibility Server Action ---
export async function toggleListingVisibilityAction(
    listingId: string,
    currentStatus: string // Pass current status to determine the target status
): Promise<ToggleVisibilityResult> {
    if (!listingId || (currentStatus !== 'LIVE' && currentStatus !== 'HIDING')) {
        return { success: false, message: "無效的操作。(Invalid action.)" };
    }

    const supabase = createClient(); // User context client

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "需要驗證身份。(Authentication required.)" };
    }

    // 2. Determine New Status
    const newStatus = currentStatus === 'LIVE' ? 'HIDING' : 'LIVE';

    // 3. Update Listing Status (Verify Ownership during update)
    console.log(`Attempting to set status to ${newStatus} for listing ${listingId} by user ${user.id}`);
    const { error: updateError } = await supabase
        .from('listings')
        .update({ 
            status: newStatus,
            updated_at: new Date().toISOString() 
        })
        .eq('listing_id', listingId)
        .eq('owner_id', user.id); // Ensure user owns the listing they're toggling

    if (updateError) {
        console.error("Error toggling listing visibility:", updateError);
        return { success: false, message: `切換顯示狀態失敗: ${updateError.message}` };
    }

    console.log(`Listing ${listingId} status toggled to ${newStatus}`);

    // 4. Revalidate Path
    revalidatePath('/analytics');
    // Also revalidate detail page if public visibility changed
    if (newStatus === 'LIVE' || currentStatus === 'LIVE') { 
        revalidatePath(`/detail/${listingId}`);
    }

    return { success: true, message: `狀態已更新為 ${newStatus}。(Status updated to ${newStatus}.)`, newStatus: newStatus };
} 