// /src/app/api/listings/detail/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`Detail API called with ID: ${id}`);

    // Log the ID format for debugging
    console.log(`ID type: ${typeof id}, value: ${id}`);

    // 從 listings 表中查詢符合 id 的資料，並關聯取得相關欄位資料
    const { data, error } = await supabase
      .from('listings')
      .select(`
        listing_id,
        listing_name,
        location,
        description,
        lat,
        lng,
        state:state_id(state_name),
        services:listing_services(
          service:service_id(service_name)
        ),
        religions:listing_religions(
          religion:religion_id(religion_name)
        ),
        gods:listing_gods(
          god:god_id(god_name)
        ),
        tag:tag_id(tag_name)
      `)
      .eq('listing_id', id)
      .single();

    if (error) {
      console.error('Error fetching listing detail:', error);
      
      // Try an alternative query without .single() to see what's available
      const checkQuery = await supabase
        .from('listings')
        .select('listing_id')
        .eq('listing_id', id);
        
      console.log('Check query results:', checkQuery);
      
      if (checkQuery.error) {
        console.error('Check query error:', checkQuery.error);
      } else if (checkQuery.data && checkQuery.data.length === 0) {
        console.log(`No listing found with ID: ${id}`);
        return NextResponse.json(
          { error: `No listing found with ID: ${id}` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch listing detail', details: error.message },
        { status: 500 }
      );
    }

    console.log('Found listing data:', data);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Error in detail API route:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}