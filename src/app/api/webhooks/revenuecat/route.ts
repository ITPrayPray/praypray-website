import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: Store your webhook secret securely in environment variables!
const REVENUECAT_WEBHOOK_AUTH_HEADER = process.env.REVENUECAT_WEBHOOK_SECRET;

// Function to verify the authorization header
async function verifyWebhookSignature(request: NextRequest): Promise<boolean> {
  if (!REVENUECAT_WEBHOOK_AUTH_HEADER) {
    console.error('RevenueCat Webhook Secret is not configured.');
    return false;
  }

  // Get headers directly from the request object
  const receivedAuthHeader = request.headers.get('Authorization');

  if (!receivedAuthHeader) {
    console.warn('Received RevenueCat webhook without Authorization header.');
    return false;
  }

  // Simple string comparison
  if (receivedAuthHeader === REVENUECAT_WEBHOOK_AUTH_HEADER) {
    return true;
  } else {
    console.warn('Received RevenueCat webhook with invalid Authorization header.');
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('Received RevenueCat Webhook request');

  // 1. Verify Authorization Header
  const isVerified = verifyWebhookSignature(request); // Can be sync if just checking headers
  if (!isVerified) {
    console.error('Webhook verification failed.');
    // Return a 401 Unauthorized response if verification fails
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('Webhook authorization verified.');

  try {
    // 2. Parse the incoming request body
    const event = await request.json();
    const eventType = event?.event?.type;
    const appUserId = event?.event?.app_user_id;
    // Extract external_id if available (adjust path based on actual event structure)
    const externalId = event?.event?.external_id || event?.event?.subscriber_attributes?.external_id?.value;
    const listingId = externalId; // Assuming external_id is the listing_id

    console.log(`Processing webhook event type: ${eventType} for user: ${appUserId}, listing: ${listingId}`);

    // 3. Handle the event based on its type
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        console.log('Handling INITIAL_PURCHASE');
        // TODO: Update Supabase listing with subscription details (RC product ID, entitlement, dates)
        // - Find listing by listingId
        // - Update revenuecat_product_id, revenuecat_entitlement_id, subscription_start_date, subscription_end_date
        // - Status should remain PENDING for admin approval
        // TODO: Optionally create/update a record in the 'subscriptions' table
        break;
      case 'RENEWAL':
        console.log('Handling RENEWAL');
        // TODO: Update Supabase listing's subscription_end_date
        // TODO: Optionally update the 'subscriptions' table record
        break;
      case 'CANCELLATION':
        console.log('Handling CANCELLATION');
        // TODO: Update Supabase listing (maybe set cancellation date or update status if desired)
        // - Note: Cancellation type (BILLING_ERROR vs CUSTOMER_CANCELLED) might be relevant
        break;
      case 'PRODUCT_CHANGE':
        console.log('Handling PRODUCT_CHANGE');
        // TODO: Update Supabase listing with new product ID, entitlement, dates
        break;
      case 'EXPIRATION':
        console.log('Handling EXPIRATION');
        // TODO: Update Supabase listing status (e.g., 'EXPIRED') or subscription_end_date
        break;
      case 'BILLING_ISSUE':
        console.log('Handling BILLING_ISSUE');
        // TODO: Optionally notify user or admin, maybe update listing status
        break;
      // Add other event types as needed
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // 4. Respond quickly with 200 OK
    console.log('Webhook processed successfully.');
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    // Return a 500 Internal Server Error if something goes wrong
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook processing failed: ${errorMessage}` }, { status: 500 });
  }
} 