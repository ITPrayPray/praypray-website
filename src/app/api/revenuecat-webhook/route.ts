import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/** 你的 Supabase 環境變數 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// 你的預期的 Authorization Token（可在 RevenueCat Webhook 設定中加上一個 Authorization Header）
// 假設我們用 "Bearer secret_revenuecat" 作範例
// const REVENUECAT_WEBHOOK_TOKEN = process.env.REVENUECAT_WEBHOOK_TOKEN || 'secret_revenuecat'

const WEBHOOK_AUTH_HEADER_VALUE = process.env.REVENUECAT_WEBHOOK_AUTH_HEADER_VALUE
const PROSERVICE_PLAN_ID = 2 // As per your information

export async function POST(request: NextRequest) {
  console.log("RevenueCat Webhook: Received a request.")

  // 1. Verify Authorization Header
  const authorizationHeader = headers().get('Authorization')
  if (!WEBHOOK_AUTH_HEADER_VALUE) {
    console.error("RevenueCat Webhook: Authorization header value is not configured in environment variables.")
    return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 })
  }
  if (authorizationHeader !== WEBHOOK_AUTH_HEADER_VALUE) {
    console.warn("RevenueCat Webhook: Unauthorized request.", { received: authorizationHeader })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let eventPayload
  try {
    eventPayload = await request.json()
  } catch (error) {
    console.error("RevenueCat Webhook: Error parsing JSON body:", error)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const event = eventPayload.event
  if (!event) {
    console.warn("RevenueCat Webhook: No event object found in payload.", eventPayload)
    return NextResponse.json({ error: 'Missing event object' }, { status: 400 })
  }

  const appUserId = event.app_user_id
  const eventType = event.type
  const rcProductId = event.product_id // RevenueCat product identifier

  console.log(`RevenueCat Webhook: Processing event type '${eventType}' for app_user_id '${appUserId}', product_id '${rcProductId}'`)

  // 2. Decide which events to process for PROSERVICE activation
  // Common events: INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE, ENTITLEMENT_GRANTED
  // We will focus on events that grant the PROSERVICE entitlement based on your product_identifiers
  const proServiceProductIdentifiers = [
    'PROSERVICE_Yearly',
    'PROSERVICE_Monthly',
    'PROSERVICE_One_off'
  ]

  if (appUserId && rcProductId && proServiceProductIdentifiers.includes(rcProductId) && 
    (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL' || eventType === 'PRODUCT_CHANGE' || eventType === 'ENTITLEMENT_GRANTED')) {
    
    console.log(`RevenueCat Webhook: Relevant event detected for PROSERVICE.`)

    // It's good practice to fetch the latest subscriber info from RevenueCat here
    // to ensure you have the most up-to-date entitlement status and period.
    // However, for simplicity in this step, we'll use data from the webhook event where possible.
    // Example using period start/end from the event if available (may vary by event type)
    // RevenueCat often provides dates in milliseconds or ISO 8601 strings.
    // Adjust based on the actual event structure for the events you choose to process.

    const startDateISO = event.period_start_at_ms ? new Date(event.period_start_at_ms).toISOString() :
                         event.event_timestamp_ms ? new Date(event.event_timestamp_ms).toISOString() : new Date().toISOString()
    
    let endDateISO: string | null = null
    if (event.period_end_at_ms) {
      endDateISO = new Date(event.period_end_at_ms).toISOString()
    } else if (event.expiration_at_ms) {
      endDateISO = new Date(event.expiration_at_ms).toISOString()
    } else if (rcProductId === 'PROSERVICE_One_off') {
      // For one-off, you might set a very long expiry or null depending on your business logic
      // For example, 100 years from now, or handle it as non-expiring (null end_date)
      const farFutureDate = new Date()
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100)
      endDateISO = farFutureDate.toISOString()
    } // Add more logic if other product types have different expiry calculations

    try {
      // 3. Upsert into 'subscriptions' table
      // Using upsert to handle both new subscriptions and updates (e.g., renewals changing end_date)
      // The conflict target should be a unique constraint, e.g., (profile_id, plan_id) if a user can only have one active sub per plan.
      // Or, if a user can have multiple instances of the same plan (e.g. gifted), then it's more complex.
      // For simplicity, assuming one active PROSERVICE plan per user for now.
      console.log(`RevenueCat Webhook: Upserting subscription for profile_id: ${appUserId}, plan_id: ${PROSERVICE_PLAN_ID}`)
      const { error: subUpsertError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          profile_id: appUserId, // This should match your profiles.id or auth.users.id
          plan_id: PROSERVICE_PLAN_ID,
          start_date: startDateISO,
          end_date: endDateISO,
          status: 'active', // Assuming purchase means active entitlement
          revenuecat_customer_id: event.original_app_user_id || appUserId, // or just appUserId
          revenuecat_product_id: rcProductId,
          revenuecat_entitlement_id: event.entitlement_ids ? event.entitlement_ids[0] : null // if entitlement_ids is an array
        }, {
          onConflict: 'profile_id,plan_id', // Define your conflict resolution strategy
          // ignoreDuplicates: false // Set to true if you want to update existing matching rows
        })

      if (subUpsertError) {
        console.error("RevenueCat Webhook: Error upserting subscription:", subUpsertError)
        // Return 500 to signal RevenueCat to retry, but be cautious with logic that might always fail.
        return NextResponse.json({ error: 'Database error during subscription update.' }, { status: 500 })
      }
      console.log("RevenueCat Webhook: Subscription upserted successfully.")

      // 4. Update the latest PENDING_PAYMENT listing for this user to PENDING
      console.log(`RevenueCat Webhook: Updating listing status for owner_id: ${appUserId}`)
      const { data: updatedListing, error: listingUpdateError } = await supabaseAdmin
        .from('listings')
        .update({ status: 'PENDING' })
        .eq('owner_id', appUserId)
        .eq('status', 'PENDING_PAYMENT')
        .order('created_at', { ascending: false }) // Get the most recent one
        .limit(1)
        .select('listing_id, status')
        .maybeSingle() // Use maybeSingle to handle 0 or 1 row

      if (listingUpdateError) {
        // If the user had no PENDING_PAYMENT listings, this might return an error or no data.
        // This might not be a critical error for the webhook itself if the subscription was recorded.
        console.warn("RevenueCat Webhook: Error or no listing found to update status:", listingUpdateError.message)
      } else if (updatedListing) {
        console.log("RevenueCat Webhook: Listing status updated to PENDING:", updatedListing)
      } else {
        console.log("RevenueCat Webhook: No PENDING_PAYMENT listing found for this user to update.")
      }

    } catch (dbError: unknown) {
      // Type check for Error object
      const errorMessage = dbError instanceof Error ? dbError.message : 'Internal database error.'
      console.error("RevenueCat Webhook: Database operation error:", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } else if (appUserId && rcProductId && proServiceProductIdentifiers.includes(rcProductId) && 
             (eventType === 'EXPIRATION' || eventType === 'CANCELLATION')) {
        
        console.log(`RC Webhook: Processing subscription termination event '${eventType}' for User: ${appUserId}, RC Product: ${rcProductId}`);
        
        let newStatus = 'expired'; // Default for EXPIRATION
        if (eventType === 'CANCELLATION') {
            // For CANCELLATION, you might want a different status if the subscription is still active until period end.
            // For simplicity here, we'll also mark it as inactive or a specific 'cancelled' status.
            // RevenueCat usually sends EXPIRATION when a cancelled sub finally ends.
            newStatus = 'cancelled'; // Or you could keep it 'active' and rely on end_date.
            console.log(`RC Webhook: Subscription ${rcProductId} for user ${appUserId} was cancelled.`);
        }

        try {
            console.log(`RC Webhook: Attempting to update subscription status to '${newStatus}' for profile_id: ${appUserId}, plan_id: ${PROSERVICE_PLAN_ID}`);
            const { data: updatedSub, error: subUpdateError } = await supabaseAdmin
                .from('subscriptions')
                .update({ 
                    status: newStatus,
                    // Optionally, ensure end_date is set if it wasn't already, e.g., from event.expiration_at_ms
                    end_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : undefined
                 })
                .eq('profile_id', appUserId)
                .eq('plan_id', PROSERVICE_PLAN_ID)
                // It's usually safer to update based on a more specific identifier if available from the event,
                // like a RevenueCat subscription ID, if you store that.
                // For now, (profile_id, plan_id) is the conflict key we used for upsert.
                .select(); // Select to see if a row was updated

            if (subUpdateError) {
                console.error(`RC Webhook: Error updating subscription status to '${newStatus}':`, subUpdateError);
                // Still return 200 if it's a non-critical update failure to prevent excessive retries for this state.
            } else if (updatedSub && updatedSub.length > 0) {
                console.log(`RC Webhook: Subscription status updated to '${newStatus}' successfully for user ${appUserId}.`);
            } else {
                console.log(`RC Webhook: No active subscription found for profile_id ${appUserId} and plan_id ${PROSERVICE_PLAN_ID} to update status to '${newStatus}'.`);
            }

            // TODO: Optionally, you might want to change the status of listings owned by this user 
            // if their PROSERVICE subscription expires/is cancelled.
            // For example, change their 'PENDING' or 'ACTIVE' listings to 'INACTIVE_SUBSCRIPTION' or similar.
            // This depends on your business rules.

        } catch (dbError: unknown) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Internal database error during status update.';
            console.error("RC Webhook: DB operation error during status update:", errorMessage);
            // Still return 200 to avoid retries for what might be a data issue (e.g. no matching sub to update)
        }

    } else {
        console.log("RC Webhook: Event not relevant for PROSERVICE or missing app_user_id/product_id, or unhandled termination event. Skipping detailed processing.");
    }

    return NextResponse.json({ received: true }, { status: 200 });
}