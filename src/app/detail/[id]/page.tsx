// /src/app/detail/[id]/page.tsx
import React from 'react';
import { headers } from 'next/headers';
import DetailPage, { DetailData } from '../../../components/DetailPage';
import ErrorDisplay from '../../../components/ErrorDisplay';

interface OperatingHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// 透過 fetch 從 API 取得詳細資料，回傳資料型別為 DetailData
async function fetchDetail(id: string): Promise<DetailData> {
  try {
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
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

    // 若 data.operating_hours 存在，使用它
    const operatingHours: OperatingHour[] = data.operating_hours || [];
    
    // 添加日誌來檢查數據
    console.log("Operating Hours Data:", {
      fromAPI: data.operating_hours,
      processed: operatingHours
    });

    return <DetailPage data={data} operatingHours={operatingHours} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return <ErrorDisplay message={errorMessage} />;
  }
}