'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../lib/utils';
import { ShoppingBag, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

// 定義從 listing_services 與 service 表抓取後的資料型別
interface Service {
  id: string;
  price?: string;
  custom_description?: string;
  // 使用明確別名來嵌入 service 表資料
  service: {
    service_name: string;
    service_description?: string;
  };
}

interface OperatingHours {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface AdditionalDetailsProps {
  listingId?: string;
  services?: Array<{
    price?: string;
    custom_description?: string;
    service: { 
      service_name: string; 
      service_description?: string 
    };
  }>;
  operatingHours?: OperatingHours[];
  contactInfo?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
}

/**
 * ServiceTable - 以表格方式顯示服務名稱、價格與自訂說明
 */
const ServiceTable: React.FC<{ services: Service[] }> = ({ services }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] text-[14px]">Service</TableHead>
            <TableHead className="w-[100px] text-[14px]">Price(HKD)</TableHead>
            <TableHead className="text-[14px]">Custom Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-[14px]">
                {item.service?.service_name || '-'}
              </TableCell>
              <TableCell className="text-[14px]">
                {item.price || '-'}
              </TableCell>
              <TableCell className="text-[14px]">
                {item.custom_description || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const OperatingHoursTable: React.FC<{ hours: OperatingHours[] }> = ({ hours }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] text-[14px]">Day</TableHead>
            <TableHead className="text-[14px]">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hours.map((hour, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-[14px] capitalize">
                {hour.day}
              </TableCell>
              <TableCell className={cn(
                "text-[14px]",
                hour.is_closed ? "text-destructive" : ""
              )}>
                {hour.is_closed ? "Closed" : `${hour.open_time} - ${hour.close_time}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

/**
 * AdditionalDetails - 綜合展示 listing 的服務與營業時間
 *
 * 此組件會從 Supabase 的 listing_services 表抓取資料，
 * 並透過已建立的外鍵關係，從 service 表取得 service_name，
 * 最後顯示服務名稱、價格與 custom_description。
 */
export const AdditionalDetails: React.FC<AdditionalDetailsProps> = ({
  listingId,
  services: initialServices,
  operatingHours,
}) => {
  // 添加日誌來檢查數據
  console.log("AdditionalDetails Props:", {
    operatingHours
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 如果已提供初始服務資料，則使用該資料
  useEffect(() => {
    if (initialServices && initialServices.length > 0) {
      // 轉換為內部 Service 介面格式
      const formattedServices = initialServices.map((service, index) => ({
        id: index.toString(),
        price: service.price,
        custom_description: service.custom_description,
        service: service.service,
      }));
      setServices(formattedServices);
      setLoading(false);
      return;
    }

    // 否則從 Supabase 取得 listing_services 的服務資料，並嵌入 service 表資料
    if (listingId) {
      const fetchServices = async () => {
        try {
          // 使用外鍵關係從 listing_services 表取得相關的服務資料
          const { data, error } = await supabase
            .from('listing_services')
            .select(`
              id,
              price,
              custom_description,
              service:fk_listing_services_service (
                service_name,
                service_description
              )
            `)
            .eq('listing_id', listingId);

          if (error) {
            console.error("Error fetching services:", error);
            setError(error.message);
          } else {
            const formattedData = data.map(item => ({
              id: item.id,
              price: item.price,
              custom_description: item.custom_description,
              service: {
                service_name: item.service[0].service_name,
                service_description: item.service[0].service_description
              }
            }));
            setServices(formattedData);
          }
        } catch (err) {
          console.error("Exception fetching services:", err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      };
      fetchServices();
    } else {
      setLoading(false);
    }
  }, [listingId, initialServices]);

  return (
    <div className="space-y-8">
      {/* 服務區塊 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-[14px] font-semibold">Services Offered</h3>
        </div>
        {loading ? (
          <p className="text-[14px] text-muted-foreground">Loading services...</p>
        ) : error ? (
          <p className="text-[14px] text-destructive">Error: {error}</p>
        ) : services.length > 0 ? (
          <ServiceTable services={services} />
        ) : (
          <p className="text-[14px] text-muted-foreground">No services available</p>
        )}
      </div>
      
      {/* 營業時間區塊 */}
      {operatingHours && operatingHours.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-[14px] font-semibold">Operating Hours</h3>
          </div>
          <OperatingHoursTable hours={operatingHours} />
        </div>
      )}
    </div>
  );
};