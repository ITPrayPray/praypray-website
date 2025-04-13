import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js'; // <-- Removed direct client
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'; // <-- Import NEW helper factory

// 配置路由不需要 Vercel 認證
export const runtime = 'nodejs';

// REMOVED global Supabase client initialization

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : 5;

  // Get the function that creates the client
  const createClient = createRouteHandlerClient(); 
  // Create the client for *this specific request*
  const supabase = createClient(request); 

  try {
    // Now this query runs in the context of the user making the request
    // and respects RLS (e.g., only show public listings if RLS is set)
    const { data, error } = await supabase
      .from('listings')
      .select('*') // Select desired fields
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent listings:', error);
      return NextResponse.json({ error: 'Failed to fetch recent listings' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
