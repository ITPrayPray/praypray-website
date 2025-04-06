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
    
    // 添加重試機制
    const maxRetries = 3;
    let retries = 0;
    let res;
    
    while (retries < maxRetries) {
      try {
        res = await fetch(url, { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) break;
        
        // 如果是認證錯誤，等待短暫時間後重試
        if (res.status === 401) {
          console.log(`Authentication error, retrying (${retries + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
          continue;
        }
        
        // 其他錯誤直接拋出
        break;
      } catch (fetchError) {
        console.error(`Fetch attempt ${retries + 1} failed:`, fetchError);
        retries++;
        if (retries >= maxRetries) throw fetchError;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!res || !res.ok) {
      const errorText = res ? await res.text() : 'No response';
      console.error(`API error (${res?.status}): ${errorText}`);
      throw new Error(`無法取得詳細資料 (${res?.status}): ${errorText}`);
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

    // 將 opening_hours 轉換為 OperatingHour 類型
    const operatingHours: OperatingHour[] = data.opening_hours ? Object.entries(data.opening_hours).map(([day, hours]) => {
      const [open_time, close_time] = hours.split('-');
      return {
        day,
        open_time: open_time.trim(),
        close_time: close_time.trim(),
        is_closed: false
      };
    }) : [];
    
    // 添加日誌來檢查數據
    console.log("Operating Hours Data:", {
      fromAPI: data.opening_hours,
      processed: operatingHours
    });

    return <DetailPage data={data} operatingHours={operatingHours} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return <ErrorDisplay message={errorMessage} />;
  }
}