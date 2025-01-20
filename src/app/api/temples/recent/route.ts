import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 使用服务角色密钥

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : 5;

  try {
    // 调试：检查 Supabase 客户端的用户信息
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
    } else {
      console.log('Supabase user:', user);
    }

    // 执行查询，获取最近的寺庙数据
    const { data, error } = await supabase
      .from('temples')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent temples:', error);
      return NextResponse.json({ error: 'Failed to fetch recent temples' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}
