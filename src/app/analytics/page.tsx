// src/app/analytics/page.tsx
'use client'; // <-- Make it a Client Component

import React, { useState, useEffect, useTransition } from 'react'; // <-- Import useState, useEffect, useTransition
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- Import useRouter
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
import { Pencil, Trash2, Loader2, Eye, EyeOff, PlusCircle } from 'lucide-react'; // Added Loader2, Eye, and PlusCircle icons
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
import { deleteListingAction, toggleListingVisibilityAction } from './actions'; // <-- Import the delete action and toggle visibility action
import { Badge } from "@/components/ui/badge"; // <-- Import Badge for status
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // For displaying subscription info

// Define a type for the fetched listing data - Add tag and status
interface UserListing {
  listing_id: string;
  listing_name: string;
  created_at: string;
  state?: { state_name: string; } | null;
  tag?: { tag_name: string; } | null; // <-- Add tag field
  status: string; // <-- Add status field (e.g., 'PENDING', 'LIVE', 'HIDING')
}

// Define expected raw data shape - Add status
interface RawListingItem {
    listing_id: string;
    listing_name: string;
    created_at: string;
    state: { state_name: string; } | { state_name: string; }[] | null;
    tag: { tag_name: string; } | null; 
    status: string; // <-- ADDED status field here
}

// ---> Interface for Subscription Details <--- 
interface SubscriptionDetails {
  start_date: string;
  end_date: string | null;
  status: string; // e.g., 'active', 'cancelled', 'expired'
  plan_id: number; // To confirm it is the PROSERVICE plan
  // We might also fetch plan_name if needed later from 'plans' table
}

export default function AnalyticsPage() {
    const supabase = createClient();
    const router = useRouter(); // <-- Initialize useRouter
    // Manage user state locally since it's a client component
    const [user, setUser] = useState<User | null>(null); // <-- Use specific type
    const [loadingUser, setLoadingUser] = useState(true);
    const [listings, setListings] = useState<UserListing[]>([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // ---> State for Subscription Details <--- 
    const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true); // Loading state for subscription details

    // State for Delete Dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [listingToDeleteId, setListingToDeleteId] = useState<string | null>(null);
    const [listingToDeleteName, setListingToDeleteName] = useState<string>("");
    const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // State for Toggle Visibility
    const [isTogglingVisibility, startTransition] = useTransition();
    const [togglingListingId, setTogglingListingId] = useState<string | null>(null);

    // ---> State for Create Type Selection Dialog <--- 
    const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false);

    const PROSERVICE_PLAN_ID = 2; // Consistent with actions.ts
    const REVENUECAT_PROSERVICE_PAYWALL_URL = process.env.NEXT_PUBLIC_REVENUECAT_PROSERVICE_PAYWALL_URL || "https://fallback-paywall-url.com/proservice"; // Fallback URL, ensure your env var is set

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

    // Fetch listings AND subscription details when user data is available
    useEffect(() => {
        if (user) {
            setLoadingListings(true);
            setLoadingSubscription(true); // Start loading subscription
            setFetchError(null);

            const fetchAllData = async () => {
                try {
                    // Fetch Listings
                    const { data: rawListingsData, error: listingsError } = await supabase
                        .from('listings')
                        .select('listing_id, listing_name, created_at, state:state_id(state_name), tag:tag_id(tag_name), status')
                        .eq('owner_id', user.id)
                        .order('created_at', { ascending: false })
                        .returns<RawListingItem[]>();
                    
                    if (listingsError) throw listingsError;
                    if (rawListingsData) {
                        // Map to the final UserListing type
                        const formattedListings: UserListing[] = rawListingsData.map(item => ({
                            listing_id: item.listing_id,
                            listing_name: item.listing_name,
                            created_at: item.created_at,
                            // Handle potential array/object/null from join
                            state: Array.isArray(item.state) ? item.state[0] ?? null : item.state ?? null,
                            tag: Array.isArray(item.tag) ? item.tag[0] ?? null : item.tag ?? null,
                            status: item.status // Should now be correctly typed
                        }));
                        setListings(formattedListings);
                    } else {
                        setListings([]);
                    }

                    // Fetch PROSERVICE Subscription Details
                    // Fetch the most recent subscription record for the proservice plan
                    const { data: subData, error: subError } = await supabase
                        .from('subscriptions')
                        .select('start_date, end_date, status, plan_id')
                        .eq('profile_id', user.id)
                        .eq('plan_id', PROSERVICE_PLAN_ID) 
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle(); // Expect 0 or 1 row

                    if (subError) throw subError;
                    if (subData) {
                        setSubscriptionDetails(subData as SubscriptionDetails);
                    } else {
                        setSubscriptionDetails(null);
                    }

                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching data";
                    console.error("Error fetching user data (listings or subscription):", errorMessage);
                    setFetchError(errorMessage);
                    setListings([]);
                    setSubscriptionDetails(null);
                } finally {
                    setLoadingListings(false);
                    setLoadingSubscription(false);
                }
            };
            fetchAllData();
        } else {
            // Clear listings if user logs out
            setListings([]);
            setLoadingListings(false); 
            setSubscriptionDetails(null);
            setLoadingSubscription(false);
        }
    }, [user, supabase, PROSERVICE_PLAN_ID]);

    // --- Toggle Visibility Handler ---
    const handleToggleVisibility = async (listingId: string, currentStatus: string) => {
        setTogglingListingId(listingId); // Set which row is loading
        startTransition(async () => {
            const result = await toggleListingVisibilityAction(listingId, currentStatus);
            if (result.success && result.newStatus) {
                // Update local state for immediate feedback
                setListings(prev => 
                    prev.map(l => 
                        l.listing_id === listingId ? { ...l, status: result.newStatus! } : l
                    )
                );
                // Optional: show success toast
            } else {
                // Optional: show error toast
                console.error("Toggle visibility failed:", result.message);
                alert(`Error toggling visibility: ${result.message}`); // Simple alert for now
            }
             setTogglingListingId(null); // Clear loading state for the row
        });
    };

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

    // ---> Navigation Handlers for Create Types <--- 
    const goToCreateTemple = () => {
        setIsCreateTypeDialogOpen(false); // Close dialog first
        router.push('/analytics/create/temple');
    };

    const goToCreateProservice = () => {
        setIsCreateTypeDialogOpen(false); // Close dialog first
        router.push('/analytics/create/proservice');
    };

    // ---> Function to render subscription status message <--- 
    const renderSubscriptionMessage = () => {
        if (loadingSubscription) {
            return <p className="text-sm text-muted-foreground mb-4">正在載入訂閱信息... (Loading subscription info...)</p>;
        }
        if (!subscriptionDetails) {
            // Could be no proservice plan ever, or plan_id doesn't match
            return null; // Or a generic message like "No active Proservice plan."
        }

        const { start_date, end_date, status } = subscriptionDetails;
        const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

        if (status === 'active') {
            return (
                <Alert variant="default" className="mb-6">
                    <AlertTitle>專業服務計劃有效 (Pro Service Plan Active)</AlertTitle>
                    <AlertDescription>
                        您的計劃生效日期：{formatDate(start_date)}。
                        {end_date ? ` 到期日期：${formatDate(end_date)}。` : ' 這是一個持續有效的計劃。'}
                    </AlertDescription>
                </Alert>
            );
        }
        if (status === 'cancelled') {
            return (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>專業服務計劃已取消 (Pro Service Plan Cancelled)</AlertTitle>
                    <AlertDescription>
                        您已取消您的專業服務計劃。目前的權益將持續到 {formatDate(end_date)}，之後將不會續費。
                    </AlertDescription>
                </Alert>
            );
        }
        if (status === 'expired') {
            return (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>專業服務計劃已過期 (Pro Service Plan Expired)</AlertTitle>
                    <AlertDescription>
                        您的專業服務計劃已於 {formatDate(end_date)} 過期。
                    </AlertDescription>
                </Alert>
            );
        }
        return null; // No message for other statuses or if no details
    };

    // --- Render Page --- 
    if (loadingUser) {
        // Optional: Show a full page loading spinner or skeleton
        return <div className="p-6">載入中... (Loading...)</div>;
    }

    return (
    <>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{user ? '我的列表 (My Listings)' : '列表管理 (Listings Management)'}</h1>
                {user && (
                    <div className="flex space-x-2">
                        {/* Conditional "Upgrade to PRO" Button */}
                        {!loadingSubscription && (!subscriptionDetails || subscriptionDetails.status === 'expired' || subscriptionDetails.status === 'cancelled') && (
                            <Button 
                                variant="default" // Or "secondary", "primary" depending on your theme
                                onClick={() => {
                                    const paywallBaseUrl = REVENUECAT_PROSERVICE_PAYWALL_URL; // This uses NEXT_PUBLIC_...

                                    if (paywallBaseUrl && paywallBaseUrl !== "https://fallback-paywall-url.com/proservice") {
                                        if (user && user.id) { // Ensure user and user.id exist
                                            const encodedAppUserId = encodeURIComponent(user.id);
                                            // Ensure there's a slash between base URL and user ID, but not double slashes if base URL already ends with one.
                                            let finalPaywallUrl = paywallBaseUrl.endsWith('/') 
                                                                    ? `${paywallBaseUrl}${encodedAppUserId}` 
                                                                    : `${paywallBaseUrl}/${encodedAppUserId}`;

                                            if (user.email) {
                                                const encodedEmail = encodeURIComponent(user.email);
                                                // Append email as query parameter. 
                                                // The server action code implies that email is the first query param if present, 
                                                // so we use '?' directly. If other params could exist on base URL, logic would be more complex.
                                                finalPaywallUrl += `?email=${encodedEmail}`; 
                                            }
                                            
                                            console.log("Analytics Page: Redirecting to Paywall:", finalPaywallUrl);
                                            window.location.href = finalPaywallUrl;

                                        } else {
                                            alert('無法獲取用戶信息，請重新登入後再試。(Cannot get user information, please log in again and retry.)');
                                            console.error("User ID is not available for paywall redirect from Analytics Page.");
                                        }
                                    } else {
                                        alert('付費牆連結配置錯誤，請聯絡管理員。(Paywall URL configuration error, please contact administrator.)');
                                        console.error("RevenueCat Proservice Paywall URL (NEXT_PUBLIC_REVENUECAT_PROSERVICE_PAYWALL_URL) is not configured or is using fallback.");
                                    }
                                }}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> {/* Or a different icon like Star or Zap */}
                                升級 PROSERVICE (Upgrade PRO)
                            </Button>
                        )}
                        <Dialog open={isCreateTypeDialogOpen} onOpenChange={setIsCreateTypeDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="mr-2 h-4 w-4" /> 創建新列表 (Create New Listing)</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>選擇列表類型 (Select Listing Type)</DialogTitle>
                                    <DialogDescription>
                                        您想創建哪種類型的列表？ (Which type of listing would you like to create?)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 gap-4 py-4">
                                    <Button variant="outline" onClick={goToCreateTemple} className="h-auto py-3 flex flex-col items-center justify-center space-y-2">
                                        <span className="text-base">創建廟宇 (Create Temple)</span>
                                        <span className="text-xs text-muted-foreground text-center px-2">適合廟宇、神壇等宗教場所。</span>
                                    </Button>
                                    <Button variant="outline" onClick={goToCreateProservice} className="h-auto py-3 flex flex-col items-center justify-center space-y-2">
                                        <span className="text-base">創建專業服務 (Create Pro Service)</span>
                                        <span className="text-xs text-muted-foreground text-center px-2">適合算命、風水、法事等專業服務提供者。</span>
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* ---> Display Subscription Message <--- */} 
            {user && renderSubscriptionMessage()}

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
                                <TableHead className="w-[15%]">類型 (Type)</TableHead>
                                <TableHead className="w-[30%]">名稱 (Name)</TableHead>
                                <TableHead>狀態 (State)</TableHead>
                                <TableHead>審批狀態 (Status)</TableHead>
                                <TableHead>創建時間 (Created)</TableHead>
                                <TableHead className="text-right">操作 (Actions)</TableHead>
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
                                        <TableCell>
                                            <Badge 
                                                variant={ 
                                                    listing.status === 'LIVE' ? 'default' : 
                                                    listing.status === 'HIDING' ? 'secondary' : 
                                                    listing.status === 'PENDING' ? 'outline' : 
                                                    'destructive' // Default for REJECTED or unknown
                                                }
                                            >
                                                {listing.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {(listing.status === 'LIVE' || listing.status === 'HIDING') && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8" 
                                                    title={listing.status === 'LIVE' ? 'Hide Listing' : 'Show Listing'}
                                                    onClick={() => handleToggleVisibility(listing.listing_id, listing.status)}
                                                    disabled={isTogglingVisibility && togglingListingId === listing.listing_id}
                                                >
                                                   {(isTogglingVisibility && togglingListingId === listing.listing_id) ? (
                                                       <Loader2 className="h-4 w-4 animate-spin" />
                                                   ) : listing.status === 'LIVE' ? (
                                                       <Eye className="h-4 w-4" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
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
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        您還沒有創建任何列表。
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
    </>
    );
}
  