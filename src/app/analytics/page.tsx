// src/app/analytics/page.tsx

// Remove 'use client'; - This will now be a Server Component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server' // <-- Import new server helper
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // <-- Import Table components
import { Pencil, Trash2 } from 'lucide-react'; // <-- Icons for actions

// Define a type for the fetched listing data - FIX STATE TYPE
interface UserListing {
  listing_id: string;
  listing_name: string;
  created_at: string;
  // state should be an object or null, not an array
  state?: { state_name: string; } | null; 
}

export default async function AnalyticsPage() {
    // --- Add Logging for Env Vars ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log("[/analytics] Server Env URL:", supabaseUrl ? 'Loaded' : 'MISSING!');
    console.log("[/analytics] Server Env Anon Key:", supabaseAnonKey ? 'Loaded' : 'MISSING!');
    // ---------------

    const supabase = createClient(); // <-- Use the new helper

    // --- 1. Get Session ---
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(); // <-- Use getUser instead of getSession for server

    // --- Add Logging ---
    console.log("[/analytics] Server Component User:", user);
    if (sessionError) {
        console.error("[/analytics] Server Component Session Error:", sessionError);
    }
    // ---------------

    let listings: UserListing[] | null = null;
    let fetchError: string | null = null;

    // --- 2. Fetch User's Listings ONLY if logged in ---
    if (user) { // <-- Check for user instead of session
        const userId = user.id;
        const { data: rawData, error } = await supabase
          .from('listings') 
          .select(`
            listing_id,
            listing_name,
            created_at,
            state:state_id(state_name) 
          `)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) {
            console.error("Error fetching user listings:", error);
            fetchError = error.message;
        } else if (rawData) {
            // Explicitly map the data to match UserListing, handling the state field
            listings = rawData.map(item => ({
                listing_id: item.listing_id,
                listing_name: item.listing_name,
                created_at: item.created_at,
                // Supabase might return state as an array even for one-to-many, take the first if it exists
                state: Array.isArray(item.state) ? item.state[0] ?? null : item.state ?? null
            }));
        } else {
            listings = []; // Ensure listings is an empty array if rawData is null
        }
    }

    // --- 3. Render Page ---
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          {/* Check for user now */}
          <h1 className="text-2xl font-bold">{user ? '我的列表 (My Listings)' : '列表管理 (Listings Management)'}</h1>
          {/* Check for user now */}
          {user && (
              <Link href="/analytics/create" passHref>
                <Button>創建新列表 (Create New Listing)</Button>
              </Link>
          )}
        </div>

        {/* Conditional Content check for user */}
        {!user ? (
            // --- Render Login Prompt --- 
            <div className="border rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center">
                 <h2 className="text-xl font-semibold mb-2">請先登入 (Please Log In)</h2>
                 <p className="text-muted-foreground mb-4">登入後即可查看和管理您的列表。(Log in to view and manage your listings.)</p>
                 {/* Optional: Add a Link to your login page */}
                 {/* <Link href="/login" passHref><Button>前往登入 (Go to Login)</Button></Link> */} 
                 <Button disabled>請先登入查看 (Login to view)</Button> { /* Placeholder disabled button */}
             </div>

        ) : fetchError ? (
            // --- Render Fetch Error --- 
            <div className="border rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center">
                 <h2 className="text-xl font-semibold mb-2 text-destructive">載入錯誤 (Loading Error)</h2>
                 <p className="text-muted-foreground">無法載入您的列表。請稍後再試。(Could not load your listings. Please try again later.)</p>
                 <p className="text-sm text-red-600 mt-2">Error: {fetchError}</p>
             </div>
             
        ) : (
            // --- Render Listings Table --- 
            <div className="border rounded-lg">
                 <Table>
                    <TableCaption>{(listings || []).length > 0 ? '您創建的列表。' : '您還沒有創建任何列表。'} ({(listings || []).length} listings total)</TableCaption>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[40%]">名稱 (Name)</TableHead>
                        <TableHead>狀態 (State)</TableHead>
                        <TableHead>創建時間 (Created)</TableHead>
                        <TableHead className="text-right">操作 (Actions)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(listings || []).length > 0 ? (
                            // Now listings should have the correct type
                            (listings || []).map((listing) => (
                                <TableRow key={listing.listing_id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/detail/${listing.listing_id}`} className="hover:underline">
                                            {listing.listing_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{listing.state?.state_name ?? 'N/A'}</TableCell>
                                    <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled title="Edit (coming soon)"><Pencil className="h-4 w-4" /></Button>
                                         <Button variant="destructive" size="icon" className="h-8 w-8" disabled title="Delete (coming soon)"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                         ) : (
                             <TableRow>
                                 <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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

      </div>
    );
}
  