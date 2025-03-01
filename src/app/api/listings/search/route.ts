import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search') || '';

  try {
    // 执行查询，获取寺庙及其关联的数据
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
      .ilike('listing_name', `%${searchQuery}%`);

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
