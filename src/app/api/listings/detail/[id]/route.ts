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
    console.log(`ID type: ${typeof id}, value: ${id}`);

    // 第一階段：查詢 listings 的基本資料（不包含服務資訊）
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(`
        listing_id,
        listing_name,
        location,
        description,
        lat,
        lng,
        state:state_id(state_name),
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

    if (listingError) {
      console.error('Error fetching listing detail:', listingError);
      return NextResponse.json(
        { error: 'Failed to fetch listing detail', details: listingError.message },
        { status: 500 }
      );
    }

    // 第二階段：分開查詢 listing_services 與 service 資料
    const { data: servicesData, error: servicesError } = await supabase
      .from('listing_services')
      .select(`
         id,
         price,
         custom_description,
         service:service_id(service_name)
      `)
      .eq('listing_id', id);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch services', details: servicesError.message },
        { status: 500 }
      );
    }

    // 將 servicesData 合併到 listingData 中
    const combinedData = {
      ...listingData,
      services: servicesData
    };

    console.log('Found combined listing data:', combinedData);
    return NextResponse.json(combinedData, { status: 200 });
  } catch (err: any) {
    console.error('Error in detail API route:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}