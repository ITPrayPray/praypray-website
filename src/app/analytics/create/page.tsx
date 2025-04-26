import React from 'react';
import { ListingForm } from '@/components/analytics/ListingForm';
import { createListingAction } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';

export default function CreateListingPage() {

  return (
    <div className="p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">數據分析 (Analytics)</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>創建 (Create)</BreadcrumbPage></BreadcrumbItem>
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
                formActionFn={createListingAction} 
            />
        </CardContent>
      </Card>
    </div>
  );
} 