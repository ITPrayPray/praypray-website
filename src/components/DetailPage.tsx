// src/components/DetailPage.tsx
'use client';
import React from 'react';

export interface DetailData {
  listing_id?: string;
  listing_name: string;
  description?: string;
  image_urls?: string[];
  location?: string;
  lat?: number;
  lng?: number;
  state?: { state_name: string };
  services?: Array<{ service: { service_name: string } }>;
  religions?: Array<{ religion: { religion_name: string } }>;
  gods?: Array<{ god: { god_name: string } }>;
  tag?: { tag_name: string };
}

interface DetailPageProps {
  data: DetailData;
}

const DetailPage: React.FC<DetailPageProps> = ({ data }) => {
  if (!data) {
    return <div>資料加載中...</div>;
  }

  return (
    <div className="detail-page p-4">
      {/* Header 區域 */}
      <header className="detail-header mb-4">
        <h1 className="text-3xl font-bold">{data.listing_name}</h1>
      </header>
      
      {/* 內容區域 */}
      <section className="detail-content mb-4">
        <p className="text-base text-gray-700">{data.description}</p>
      </section>
      
      {/* 標籤與資訊區域 */}
      <section className="detail-metadata mb-4">
        {data.state && (
          <div className="mb-2">
            <span className="font-semibold">地區: </span>
            <span>{data.state.state_name}</span>
          </div>
        )}
        
        {data.gods && data.gods.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">神明: </span>
            <span>{data.gods.map(g => g.god.god_name).join(', ')}</span>
          </div>
        )}
        
        {data.religions && data.religions.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">宗教: </span>
            <span>{data.religions.map(r => r.religion.religion_name).join(', ')}</span>
          </div>
        )}
        
        {data.services && data.services.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">服務: </span>
            <span>{data.services.map(s => s.service.service_name).join(', ')}</span>
          </div>
        )}
      </section>
      
      {/* 圖片展示區 */}
      {data.image_urls && data.image_urls.length > 0 && (
        <section className="detail-images mb-4">
          {/* 可使用 react-slick 等套件來做圖片輪播 */}
          <div className="image-slider">
            {data.image_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-auto object-cover mb-2"
              />
            ))}
          </div>
        </section>
      )}
      
      {/* 地圖區域 */}
      {data.location && (
        <section className="detail-map mb-4">
          {/* 可嵌入 GoogleMapComponent 或其他地圖元件 */}
          <div className="map-placeholder bg-gray-200 w-full h-64 flex items-center justify-center">
            <p className="text-gray-600">{data.location}</p>
          </div>
        </section>
      )}
      
      {/* 導航按鈕 */}
      <section className="detail-actions">
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回搜尋結果
        </button>
      </section>
    </div>
  );
};

export default DetailPage;