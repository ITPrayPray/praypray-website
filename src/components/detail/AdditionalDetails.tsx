'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, Phone, Mail, Globe, MessageSquare, ShoppingBag } from 'lucide-react';
import { DetailData } from '../DetailPage';
import { cn } from '@/lib/utils';

interface AdditionalDetailsProps {
  services?: DetailData['services'];
  operatingHours?: DetailData['operating_hours'];
  contactInfo?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
}

/**
 * AdditionalDetails - Comprehensive display of listing details including services,
 * operating hours, and contact information in a scrollable single-page format
 */
export const AdditionalDetails: React.FC<AdditionalDetailsProps> = ({
  services,
  operatingHours,
  contactInfo
}) => {
  const hasServices = services && services.length > 0;
  const hasOperatingHours = operatingHours && operatingHours.length > 0;
  const hasContactInfo = contactInfo && (
    contactInfo.phone || contactInfo.whatsapp || contactInfo.email || contactInfo.website
  );
  
  // Initialize WhatsApp chat if available
  const openWhatsApp = () => {
    if (contactInfo?.whatsapp) {
      const phoneNumber = contactInfo.whatsapp.startsWith('+') 
        ? contactInfo.whatsapp.substring(1) 
        : contactInfo.whatsapp;
      
      window.open(`https://wa.me/${phoneNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-8">
      {/* Services Section */}
      {hasServices && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-gray-900">Services Offered</h3>
          </div>
          <Card className="overflow-hidden border-border">
            <CardContent className="p-6">
              <ul className="space-y-4 divide-y divide-gray-100">
                {services?.map((item, index) => (
                  <li key={index} className={cn("flex items-start gap-3", index > 0 && "pt-4")}>
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-primary font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.service.service_name}</h4>
                      {item.service.service_description && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {item.service.service_description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Operating Hours Section */}
      {hasOperatingHours && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-gray-900">Operating Hours</h3>
          </div>
          <Card className="overflow-hidden border-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operatingHours?.map((hour, index) => (
                  <div key={index} 
                    className={cn(
                      "flex justify-between items-center py-2 px-3 rounded-lg",
                      hour.is_closed 
                        ? "bg-red-50" 
                        : index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize text-gray-900">{hour.day}</span>
                    </div>
                    <span className={cn(
                      "font-medium", 
                      hour.is_closed ? "text-red-500" : "text-gray-700"
                    )}>
                      {hour.is_closed ? "Closed" : `${hour.open_time} - ${hour.close_time}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Contact Information Section */}
      {hasContactInfo && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
          </div>
          <Card className="overflow-hidden border-border">
            <CardContent className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactInfo?.phone && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg transition-colors hover:bg-gray-100">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Phone</div>
                        <a href={`tel:${contactInfo.phone}`} className="text-primary font-medium hover:underline">
                          {contactInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contactInfo?.email && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg transition-colors hover:bg-gray-100">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Email</div>
                        <a href={`mailto:${contactInfo.email}`} className="text-primary font-medium hover:underline break-all">
                          {contactInfo.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contactInfo?.website && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg transition-colors hover:bg-gray-100">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Website</div>
                        <a 
                          href={contactInfo.website.startsWith('http') ? contactInfo.website : `https://${contactInfo.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary font-medium hover:underline break-all"
                        >
                          {contactInfo.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {contactInfo?.whatsapp && (
                  <div className="mt-4">
                    <Button 
                      onClick={openWhatsApp} 
                      className="w-full md:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat on WhatsApp
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Available for instant messaging and quick responses
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};