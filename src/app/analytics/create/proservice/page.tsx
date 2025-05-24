'use client'; // Form uses useFormState, needs to be client component

import Link from 'next/link';
import { ListingForm } from '@/components/analytics/ListingForm';
// ---> Temporarily import and use createTempleListingAction for testing <--- 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTempleListingAction, createProserviceListingAction } from '@/app/analytics/actions'; // Keep both for easy switch back
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function CreateProserviceListingPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">我的列表</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>創建專業服務列表 (Test)</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-2xl font-bold mb-6">創建新的專業服務列表 (Create New Pro Service Listing - Test Mode)</h1>
            <ListingForm 
                mode="create"
                listingType="PROSERVICE" // Still PROSERVICE to test form rendering for this type
                formActionFn={createTempleListingAction} // ---> Using Temple action for now <---
                // formActionFn={createProserviceListingAction} // Original action commented out
            />
        </div>
    );
}
