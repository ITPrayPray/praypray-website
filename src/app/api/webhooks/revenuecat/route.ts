import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Restore Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; // Use NEXT_PUBLIC_ prefix
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false, // Optional: Disable auto refresh
  },
});

// Use the correct env var name for the auth header value
const REVENUECAT_WEBHOOK_AUTH_HEADER = process.env.REVENUECAT_WEBHOOK_SECRET; // Use the secret set in Vercel

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

export async function POST(req: NextRequest) {
  console.log('Received RevenueCat Webhook request');

  // 1. Verify Authorization Header
  const isVerified = verifyWebhookSignature(req); // Can be sync if just checking headers
  if (!isVerified) {
    console.error('Webhook verification failed.');
    // Return a 401 Unauthorized response if verification fails
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('Webhook authorization verified.');

  try {
    const body = await req.json();
    const event = body.event;
    if (!event) {
      return NextResponse.json({ error: 'Missing event data' }, { status: 400 });
    }

    // Only destructure currently used variables
    const { type, product_id } = event;
    // Access others directly when needed: event.app_user_id, event.entitlement_id, etc.

    console.log(`Processing webhook event type: ${type}, product_id: ${product_id}`);

    // 3. 根據 event.type 更新 Supabase DB
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // IMPORTANT: Needs correct identifier logic using external_id (listing_id)
        await supabase
          .from('listings')
          .update({ 
            status: 'pending_review',
            revenuecat_product_id: product_id, // Store product ID
            // TODO: Extract and store other fields like entitlement_id, start/end dates
            // subscription_start_date: event.store_transaction?.transaction_date_ms ? new Date(event.store_transaction.transaction_date_ms).toISOString() : new Date().toISOString(),
            // subscription_end_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
            // revenuecat_entitlement_id: event.entitlement_ids?.[0] // Example: get first entitlement
          })
          .eq('revenuecat_product_id', product_id); // Placeholder - Needs correct identifier
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        // IMPORTANT: Needs correct identifier logic using external_id (listing_id)
        await supabase
          .from('listings')
          .update({ status: 'canceled' })
          .eq('revenuecat_product_id', product_id); // Placeholder - Needs correct identifier
        break;

      default:
        break;
    }

    // 4. Respond quickly with 200 OK
    console.log('Webhook processed successfully.');
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: unknown) {
    console.error('RevenueCat Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 