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
    console.log('Querying listing with ID:', id);
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(`
        listing_id,
        listing_name,
        location,
        description,
        lat,
        lng,
        phone,
        email,
        website,
        facebook,
        instagram,
        whatsapp,
        icon,
        google_map_link,
        state:state_id(state_name),
        religions:listing_religions(
          religion:religion_id(religion_name)
        ),
        gods:listing_gods(
          god:god_id(god_name)
        ),
        tag:tag_id(
          tag_name,
          id
        ),
        opening_hours
      `)
      .eq('listing_id', id)
      .single();

    // 添加原始查詢結果日誌
    console.log('Raw database response:', {
      error: listingError,
      data: listingData,
      requestedId: id
    });

    if (listingError) {
      console.error('Error fetching listing detail:', listingError);
      return NextResponse.json(
        { error: 'Failed to fetch listing detail', details: listingError.message },
        { status: 500 }
      );
    }

    // 添加詳細的數據日誌
    console.log('Raw listing data:', {
      id,
      phone: listingData?.phone,
      email: listingData?.email,
      google_map_link: listingData?.google_map_link,
      fullData: listingData
    });

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

    // 第三階段：查詢帖子數據（從 comments 表中獲取）
    const { data: postsData, error: postsError } = await supabase
      .from('comments')
      .select(`
        comment_id,
        content,
        created_at,
        user_id,
        listing_id
      `)
      .eq('listing_id', id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    // 獲取 listing 的 owner_id
    const { data: listingOwnerData, error: ownerError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('listing_id', id)
      .single();

    if (ownerError) {
      console.error('Error fetching listing owner:', ownerError);
      return NextResponse.json(
        { error: 'Failed to fetch listing owner', details: ownerError.message },
        { status: 500 }
      );
    }

    // 過濾出擁有者的評論作為帖子，並轉換格式
    const ownerPosts = postsData?.filter(post => post.user_id === listingOwnerData.owner_id).map(post => ({
      ...post,
      title: post.content // 使用 content 作為 title
    })) || [];

    // 將所有數據合併到一起
    const combinedData = {
      ...listingData,
      services: servicesData,
      posts: ownerPosts
    };

    console.log('Found combined listing data:', combinedData);
    return NextResponse.json(combinedData, { status: 200 });
  } catch (err: unknown) {
    console.error('Error in detail API route:', err);
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}