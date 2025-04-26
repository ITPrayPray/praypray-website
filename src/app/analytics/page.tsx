// src/app/analytics/page.tsx
'use client'; // <-- Make it a Client Component

import React, { useState, useEffect } from 'react'; // <-- Import useState, useEffect
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // No longer needed
// import { cookies } from 'next/headers'; // No longer needed
import { createClient } from '@/lib/supabase/client'; // <-- Use CLIENT helper
// import { useUser } from '@supabase/auth-helpers-react'; // <-- Remove unused import
import { type User } from '@supabase/supabase-js'; // <-- Import User type
// Let's stick to manual fetch within useEffect for now, removing useUser dependence
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Loader2 } from 'lucide-react'; // Added Loader2
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose // Import DialogClose
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { deleteListingAction } from './actions'; // <-- Import the delete action

// Define a type for the fetched listing data - Add tag
interface UserListing {
  listing_id: string;
  listing_name: string;
  created_at: string;
  state?: { state_name: string; } | null;
  tag?: { tag_name: string; } | null; // <-- Add tag field
}

export default function AnalyticsPage() {
    const supabase = createClient();
    // Manage user state locally since it's a client component
    const [user, setUser] = useState<User | null>(null); // <-- Use specific type
    const [loadingUser, setLoadingUser] = useState(true);
    const [listings, setListings] = useState<UserListing[]>([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // State for Delete Dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [listingToDeleteId, setListingToDeleteId] = useState<string | null>(null);
    const [listingToDeleteName, setListingToDeleteName] = useState<string>("");
    const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Fetch user data on mount
    useEffect(() => {
        const getUserData = async () => {
            setLoadingUser(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            setLoadingUser(false);
        };
        getUserData();

        // Optional: Listen for auth changes if needed for reactivity w/o full page refresh
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            // setLoadingUser(false); // Already handled?
        });

        return () => {
             authListener?.subscription.unsubscribe();
        };
    }, [supabase]);

    // Fetch listings when user data is available
    useEffect(() => {
        if (user) {
            const fetchListings = async () => {
                setLoadingListings(true);
                setFetchError(null);
                 // Define expected shape for raw data explicitly
                 interface RawListingItem {
                    listing_id: string;
                    listing_name: string;
                    created_at: string;
                    state: { state_name: string; } | { state_name: string; }[] | null;
                    tag: { tag_name: string; } | { tag_name: string; }[] | null; 
                 }
                const { data: rawData, error } = await supabase
                    .from('listings')
                    .select('listing_id, listing_name, created_at, state:state_id(state_name), tag:tag_id(tag_name)')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false })
                    .returns<RawListingItem[]>(); // Use the explicit raw type
                
                if (error) {
                    console.error("Error fetching user listings:", error);
                    setFetchError(error.message);
                    setListings([]);
                } else if (rawData) {
                    // Map to the final UserListing type
                    const formattedListings: UserListing[] = rawData.map(item => ({
                        listing_id: item.listing_id,
                        listing_name: item.listing_name,
                        created_at: item.created_at,
                        // Handle potential array/object/null from join
                        state: Array.isArray(item.state) ? item.state[0] ?? null : item.state ?? null,
                        tag: Array.isArray(item.tag) ? item.tag[0] ?? null : item.tag ?? null
                    }));
                    setListings(formattedListings);
                } else {
                    setListings([]);
                }
                setLoadingListings(false);
            };
            fetchListings();
        } else {
            // Clear listings if user logs out
            setListings([]);
            setLoadingListings(false); 
        }
    }, [user, supabase]); // Re-fetch if user changes

    // --- Delete Logic --- 
    const openDeleteDialog = (listingId: string, listingName: string) => {
        setListingToDeleteId(listingId);
        setListingToDeleteName(listingName);
        setIsDeleteConfirmed(false);
        setDeleteConfirmationText("");
        setDeleteError(null);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!listingToDeleteId || !isDeleteConfirmed || deleteConfirmationText !== 'DELETE') {
            setDeleteError("確認步驟未完成。(Confirmation steps not completed.)");
            return;
        }
        setIsDeleting(true);
        setDeleteError(null);

        // Call the actual Server Action
        const result = await deleteListingAction(listingToDeleteId); 

        setIsDeleting(false);
        if (result.success) {
            // Remove listing from local state for immediate feedback
            setListings(prev => prev.filter(l => l.listing_id !== listingToDeleteId));
            setIsDeleteDialogOpen(false); // Close dialog on success
            // Optional: Show a success toast notification
        } else {
            setDeleteError(result.message || "刪除失敗。(Failed to delete.)");
        }
    };
    // Check if the final delete button should be enabled
    const canConfirmDelete = isDeleteConfirmed && deleteConfirmationText === 'DELETE';

    // --- Render Page --- 
    if (loadingUser) {
        // Optional: Show a full page loading spinner or skeleton
        return <div className="p-6">載入中... (Loading...)</div>;
    }

    return (
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{user ? '我的列表 (My Listings)' : '列表管理 (Listings Management)'}</h1>
                {user && (
                    <Link href="/analytics/create" passHref>
                        <Button>創建新列表 (Create New Listing)</Button>
                    </Link>
                )}
            </div>

            {!user ? (
                // --- Render Login Prompt --- 
                <div className="border rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-semibold mb-2">請先登入 (Please Log In)</h2>
                    <p className="text-muted-foreground mb-4">登入後即可查看和管理您的列表。(Log in to view and manage your listings.)</p>
                    <Button disabled>請先登入查看 (Login to view)</Button>
                </div>
            ) : loadingListings ? (
                // --- Render Loading State for Table --- 
                <div className="border rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : fetchError ? (
                // --- Render Fetch Error --- 
                <div className="border rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-semibold mb-2 text-destructive">載入錯誤 (Loading Error)</h2>
                    <p className="text-muted-foreground">無法載入您的列表。請稍後再試。</p>
                    <p className="text-sm text-red-600 mt-2">Error: {fetchError}</p>
                </div>
            ) : (
                // --- Render Listings Table --- 
                <div className="border rounded-lg">
                    <Table>
                        <TableCaption>{listings.length > 0 ? '您創建的列表。' : '您還沒有創建任何列表。'} ({listings.length} listings total)</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[15%]">類型</TableHead>
                                <TableHead className="w-[35%]">名稱</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead>創建時間</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.length > 0 ? (
                                listings.map((listing) => (
                                    <TableRow key={listing.listing_id}>
                                        <TableCell>{listing.tag?.tag_name ?? 'N/A'}</TableCell>
                                        <TableCell className="font-medium">
                                            <Link href={`/detail/${listing.listing_id}`} className="hover:underline">
                                                {listing.listing_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{listing.state?.state_name ?? 'N/A'}</TableCell>
                                        <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={`/analytics/edit/${listing.listing_id}`} passHref>
                                                <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Listing">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="h-8 w-8" 
                                                    title="Delete Listing"
                                                    onClick={() => openDeleteDialog(listing.listing_id, listing.listing_name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        您還沒有創建任何列表。
                                        <Link href="/analytics/create" className="text-primary hover:underline ml-2">
                                            現在創建一個！
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>確認刪除列表？(Confirm Deletion?)</DialogTitle>
                    <DialogDescription>
                        此操作無法撤銷。將永久刪除列表 &quot;<span className="font-semibold">{listingToDeleteName}</span>&quot; 及其所有關聯數據。
                        (This action cannot be undone. This will permanently delete the listing &quot;<span className="font-semibold">{listingToDeleteName}</span>&quot; and all associated data.)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="delete-confirm-checkbox"
                            checked={isDeleteConfirmed}
                            onCheckedChange={(checked) => setIsDeleteConfirmed(checked === true)} // Ensure boolean
                        />
                        <Label htmlFor="delete-confirm-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            我理解此操作無法撤銷。(I understand this action cannot be undone.)
                        </Label>
                    </div>
                    <div>
                        <Label htmlFor="delete-confirm-text" className={cn(!isDeleteConfirmed && "text-muted-foreground")}>
                            請輸入 &quot;DELETE&quot; 以確認。(Please type &quot;DELETE&quot; to confirm.)
                        </Label>
                        <Input 
                            id="delete-confirm-text"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            placeholder="DELETE"
                            disabled={!isDeleteConfirmed}
                            className={cn("mt-1", deleteConfirmationText !== 'DELETE' && deleteConfirmationText.length > 0 && "border-destructive focus-visible:ring-destructive")}
                        />
                    </div>
                    {deleteError && (
                        <p className="text-sm text-red-600">{deleteError}</p>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isDeleting}>取消 (Cancel)</Button>
                    </DialogClose>
                    <Button 
                        variant="destructive" 
                        onClick={handleDelete} 
                        disabled={!canConfirmDelete || isDeleting}
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isDeleting ? '刪除中...(Deleting...)' : '確認刪除 (Confirm Delete)'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </div>
      </Dialog>
    );
}
  