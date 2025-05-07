import React from 'react';
import { ListingForm } from '@/components/analytics/ListingForm';
import { createTempleListingAction } from '@/app/analytics/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';

export default function CreateListingPage() {
  // This page is likely no longer directly used in the new flow.
  // The user is navigated to /analytics/create/temple or /analytics/create/proservice.
  // Providing a default listingType and action to resolve the TypeScript error.
  return (
    <div className="p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">數據分析 (Analytics)</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          {/* Updated Breadcrumb to reflect a default choice if this page were used */}
          <BreadcrumbItem><BreadcrumbPage>創建列表 (Create Listing - Default Temple)</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
       </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>創建新列表 (Create New Listing)</CardTitle>
          <CardDescription>請填寫以下詳細信息以創建您的列表。(Fill in the details below to create your listing.)</CardDescription>
        </CardHeader>
        <CardContent>
            <ListingForm 
                mode="create" 
                listingType="TEMPLE"
                formActionFn={createTempleListingAction}
            />
        </CardContent>
      </Card>
    </div>
  );
} 