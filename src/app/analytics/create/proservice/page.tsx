'use client'; // Form uses useFormState, needs to be client component

import Link from 'next/link';
import { ListingForm } from '@/components/analytics/ListingForm';
import { createProserviceListingAction } from '@/app/analytics/actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function CreateProserviceListingPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">我的列表</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>創建專業服務列表</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-2xl font-bold mb-6">創建新的專業服務列表 (Create New Pro Service Listing)</h1>
            <ListingForm 
                mode="create"
                listingType="PROSERVICE"
                formActionFn={createProserviceListingAction}
                // initialData={null} // Pass null or omit for create mode
            />
        </div>
    );
}
