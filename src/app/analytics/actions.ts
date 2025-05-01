'use server';

import { createClient } from '@/lib/supabase/server';
import { createServerClient as createAdminSupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/database.types'; 

// ... interface CreateListingResult ...
// ... interface SelectedServiceData ...
// ... createListingAction function ...

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