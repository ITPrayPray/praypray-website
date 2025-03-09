'use client';

import React from 'react';
import { DetailData } from '../DetailPage';
import { cn } from '@/lib/utils';
import { ShoppingBag, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Service {
  service: {
    service_name: string;
    service_description?: string;
    price?: string;
  };
}

interface AdditionalDetailsProps {
  services?: Service[];
  operatingHours?: DetailData['operating_hours'];
}

const ServiceTable: React.FC<{ services: Service[] }> = ({ services }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] text-[14px]">Service Name</TableHead>
            <TableHead className="w-[100px] text-right text-[14px]">Price</TableHead>
            <TableHead className="text-[14px]">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-[14px]">{item.service.service_name}</TableCell>
              <TableCell className="text-right text-[14px]">{item.service.price || '-'}</TableCell>
              <TableCell className="text-[14px]">{item.service.service_description || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const OperatingHoursTable: React.FC<{ hours: DetailData['operating_hours'] }> = ({ hours }) => {
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
                hour.is_closed ? "text-red-500" : "text-gray-700"
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
 * AdditionalDetails - Comprehensive display of listing details including services,
 * operating hours, and contact information in a scrollable single-page format
 */
export const AdditionalDetails: React.FC<AdditionalDetailsProps> = ({
  services,
  operatingHours,
}) => {
  const hasServices = services && services.length > 0;
  const hasOperatingHours = operatingHours && operatingHours.length > 0;
  
  return (
    <div className="space-y-8">
      {/* Services Section */}
      {hasServices && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="text-[14px] font-semibold text-gray-900">Services Offered</h3>
          </div>
          <ServiceTable services={services} />
        </div>
      )}
      
      {/* Operating Hours Section */}
      {hasOperatingHours && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-[14px] font-semibold text-gray-900">Operating Hours</h3>
          </div>
          <OperatingHoursTable hours={operatingHours} />
        </div>
      )}      
    </div>
  );
};