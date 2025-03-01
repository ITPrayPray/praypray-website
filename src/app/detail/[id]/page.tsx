// /src/app/detail/[id]/page.tsx
import React from 'react';
import { headers } from 'next/headers';
import DetailPage, { DetailData } from '../../../components/DetailPage';
import ErrorDisplay from '../../../components/ErrorDisplay';

// 透過 fetch 從 API 取得詳細資料，回傳資料型別為 DetailData
async function fetchDetail(id: string): Promise<DetailData> {
  try {
    // 從請求標頭取得 host 資訊
    const host = headers().get('host');
    // 根據環境設定協議，開發環境使用 http，其他環境使用 https
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    // 組合出完整的絕對 URL
    const url = `${protocol}://${host}/api/listings/detail/${id}`;
    
    console.log(`Fetching from: ${url}`);
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error (${res.status}): ${errorText}`);
      throw new Error(`無法取得詳細資料 (${res.status}): ${errorText}`);
    }
    
    const data = await res.json();
    console.log("Received data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching detail:", error);
    throw error;
  }
}

// 動態路由頁面：根據 URL 參數取得對應的 listing 詳細資料，並傳入 DetailPage 組件進行渲染
export default async function Page({ params }: { params: { id: string } }) {
  try {
    console.log("Detail page for ID:", params.id);
    const data = await fetchDetail(params.id);
    return <DetailPage data={data} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return <ErrorDisplay message={errorMessage} />;
  }
}