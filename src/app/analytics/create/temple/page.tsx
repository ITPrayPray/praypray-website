'use client'; // Form uses useFormState, needs to be client component

import Link from 'next/link';
import { ListingForm } from '@/components/analytics/ListingForm';
import { createTempleListingAction } from '@/app/analytics/actions';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function CreateTempleListingPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink asChild><Link href="/analytics">我的列表</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>創建廟宇列表</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-2xl font-bold mb-6">創建新的廟宇列表 (Create New Temple Listing)</h1>
            <ListingForm 
                mode="create"
                listingType="TEMPLE"
                formActionFn={createTempleListingAction}
                // initialData={null} // Pass null or omit for create mode
            />
        </div>
    );
}
