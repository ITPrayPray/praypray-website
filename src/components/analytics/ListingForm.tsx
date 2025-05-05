'use client';

import React, { useState, useEffect, ChangeEvent, useMemo, useRef } from 'react';
import { useFormState } from 'react-dom';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, Check, ChevronsUpDown, X, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
// import { User } from '@supabase/supabase-js'; // No longer needed for RC init here
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
// --- Remove RevenueCat Imports --- 
// import { Purchases, PurchasesError, CustomerInfo, LogLevel, PurchasesOffering as Offering, PurchasesPackage as Package, PurchasesStoreProduct as StoreProduct } from '@revenuecat/purchases-js';
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Keep Alert for form errors

// --- Interfaces --- 
interface State { state_id: string; state_name: string; }
interface Region { region_id: string; region_name: string; }
interface Religion { religion_id: string; religion_name: string; }
interface God { god_id: string; god_name: string; }
interface Service { service_id: string; service_name: string; }
interface SelectedService extends Service { price: string; custom_description: string; }
interface DayHours { open: string; close: string; isClosed: boolean; }

// Interface for initial data (subset of full Listing data)
// Make fields optional as they might not exist initially
export interface ListingFormData {
    listing_id?: string;
    listing_name?: string;
    description?: string;
    location?: string;
    lat?: number | null;
    lng?: number | null;
    phone?: string;
    email?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    xiaohongshu?: string | null;
    google_map_link?: string;
    state_id?: string;
    tag_id?: string; // Stored as string ('1' or '2')
    icon?: string | null; // URL from DB
    opening_hours?: Record<string, string> | null; // JSON from DB
    // Need initial state for selected Religions, Gods, Services
    selected_religions?: string[]; // Array of religion_ids
    selected_gods?: string[]; // Array of god_ids
    selected_services_data?: SelectedService[]; // Full data needed for list
}

// Define the expected shape of the server action result (Updated)
interface FormActionResult {
  success: boolean;
  message: string;
  listingId?: string;
  shouldRedirect?: boolean; // Flag for client-side redirect
  redirectUrl?: string;    // URL for client-side redirect
}

// --- Props for the Reusable Form --- 
interface ListingFormProps {
    initialData?: ListingFormData | null; 
    mode: 'create' | 'edit';
    // Pass the specific server action (create or update)
    formActionFn: (prevState: FormActionResult | undefined, formData: FormData) => Promise<FormActionResult>;
    // ---> ADDED: Receive the type as a prop <--- 
    listingType: 'TEMPLE' | 'PROSERVICE';
}

// Initial state for useFormState
const initialFormState: FormActionResult = {
  success: false,
  message: '',
  shouldRedirect: false,
  redirectUrl: undefined,
};

// --- Reusable Form Component --- 
export function ListingForm({ initialData, mode, formActionFn, listingType }: ListingFormProps) {
  const supabase = createClient();
  // Remove RevenueCat instance state
  // const [purchasesInstance, setPurchasesInstance] = useState<Purchases | null>(null);

  // --- Form State Initialization --- 
  // Initialize state from initialData if in edit mode, otherwise use defaults
  const [name, setName] = useState(initialData?.listing_name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [lat, setLat] = useState<number | ''>(initialData?.lat ?? '');
  const [lng, setLng] = useState<number | ''>(initialData?.lng ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [website, setWebsite] = useState(initialData?.website ?? '');
  const [facebook, setFacebook] = useState(initialData?.facebook ?? '');
  const [instagram, setInstagram] = useState(initialData?.instagram ?? '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? '');
  const [xiaohongshu, setXiaohongshu] = useState(initialData?.xiaohongshu ?? '');
  const [googleMapLink, setGoogleMapLink] = useState(initialData?.google_map_link ?? '');
  const [stateId, setStateId] = useState(initialData?.state_id ?? ''); 

  // Icon handling
  const [iconFile, setIconFile] = useState<File | null>(null);
  // Preview can be existing URL or new file preview
  const [iconPreview, setIconPreview] = useState<string | null>(initialData?.icon ?? null);
  const existingIconUrl = useRef<string | null>(initialData?.icon ?? null); // Track original URL

  // Opening Hours - Need to parse initial JSON data
  const parseInitialHours = (): Record<string, DayHours> => {
      const initial: Record<string, DayHours> = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const hoursFromDb = initialData?.opening_hours ?? {};
      
      days.forEach(day => {
          const keyLower = day.toLowerCase();
          const hoursString = Object.entries(hoursFromDb).find(([k]) => k.toLowerCase() === keyLower)?.[1];
          
          if (hoursString && hoursString.includes('-')) {
              const [open, close] = hoursString.split('-');
              initial[day] = { open: open.trim(), close: close.trim(), isClosed: false };
          } else {
              initial[day] = { open: '09:00', close: '17:00', isClosed: true }; // Default closed
          }
      });
      return initial;
  };
  const [dailyHours, setDailyHours] = useState<Record<string, DayHours>>(parseInitialHours);
  
  // Religion/God/Service Selection
  const [allReligions, setAllReligions] = useState<Religion[]>([]);
  const [selectedReligionIds, setSelectedReligionIds] = useState<string[]>(initialData?.selected_religions ?? []);
  const [isLoadingReligions, setIsLoadingReligions] = useState(true);
  const [allGods, setAllGods] = useState<God[]>([]);
  const [selectedGodIds, setSelectedGodIds] = useState<string[]>(initialData?.selected_gods ?? []);
  const [isGodComboboxOpen, setIsGodComboboxOpen] = useState(false);
  const [isLoadingGods, setIsLoadingGods] = useState(true);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(initialData?.selected_services_data ?? []);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [currentServiceSelection, setCurrentServiceSelection] = useState<string>("");
  const [isServiceComboboxOpen, setIsServiceComboboxOpen] = useState(false);
  
  // State/Region
  const [regionsList, setRegionsList] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isStateComboboxOpen, setIsStateComboboxOpen] = useState(false);
  // Need to derive selectedRegionId from initial stateId
   const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null); 

  // --- useFormState --- 
  const [formState, formAction] = useFormState(formActionFn, initialFormState);

  // Remove RevenueCat specific states
  // const [selectedProductId, setSelectedProductId] = useState<string>(DEFAULT_PROSERVICE_PRODUCT_ID);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  // const [revenueCatInitialized, setRevenueCatInitialized] = useState<boolean>(false);
  // const supabaseUser = useRef<User | null>(null); // No longer needed here

  // --- Data Fetching Effects --- 
  // Fetch Regions, Religions, Gods, Services (run once)
  useEffect(() => {
      const fetchInitialData = async () => {
         if (!supabase) return;
         setIsLoadingRegions(true); setIsLoadingReligions(true); setIsLoadingGods(true); setIsLoadingServices(true);
         try {
            const [regionsRes, religionsRes, godsRes, servicesRes] = await Promise.all([
                supabase.from('regions').select('region_id, region_name').order('region_name'),
                supabase.from('religions').select('religion_id, religion_name').order('religion_name'),
                supabase.from('gods').select('god_id, god_name').order('god_name'),
                supabase.from('services').select('service_id, service_name').order('service_name')
            ]);
            if (regionsRes.error) console.error('Error fetching regions:', regionsRes.error);
            else setRegionsList(regionsRes.data || []);
            if (religionsRes.error) console.error('Error fetching religions:', religionsRes.error);
            else setAllReligions(religionsRes.data || []);
            if (godsRes.error) console.error('Error fetching gods:', godsRes.error);
            else setAllGods(godsRes.data || []);
            if (servicesRes.error) console.error('Error fetching services:', servicesRes.error);
            else setAllServices(servicesRes.data || []);

            // If editing, find the initial region based on the initial stateId
             if (mode === 'edit' && initialData?.state_id && regionsRes.data) {
                 const { data: stateRegionData, error: stateRegionError } = await supabase
                     .from('states')
                     .select('region_id')
                     .eq('state_id', initialData.state_id)
                     .single();
                 if (stateRegionError) {
                     console.error('Error fetching initial region for state:', stateRegionError);
                 } else if (stateRegionData?.region_id) {
                     setSelectedRegionId(stateRegionData.region_id);
                 }
             } else if (mode === 'create') {
                  setSelectedRegionId(null); // Ensure region is clear for create
             }

         } catch (err) { console.error('Error fetching initial form data:', err); }
          finally { setIsLoadingRegions(false); setIsLoadingReligions(false); setIsLoadingGods(false); setIsLoadingServices(false); }
      };
      fetchInitialData();
  }, [supabase, mode, initialData?.state_id]); // Dependencies

  // Fetch States (depends on region)
  useEffect(() => {
      const fetchStatesForRegion = async () => {
          // If NO region selected OR supabase not ready
          if (!supabase || !selectedRegionId) { 
              setStates([]); // Clear the states list
              setIsLoadingStates(false); // Stop loading indicator

              // If creating a new form OR region explicitly deselected, clear stateId
              if (mode === 'create' || !selectedRegionId) { 
                  setStateId(''); 
              }
              return; // Don't proceed to fetch
          }

          // If region IS selected
          setIsLoadingStates(true); // Start loading indicator
          try {
              // Fetch states matching the selected region
              const { data, error } = await supabase
                  .from('states')
                  .select('state_id, state_name')
                  .eq('region_id', selectedRegionId) 
                  .order('state_name', { ascending: true });
              
              if (error) {
                  console.error(`Error fetching states:`, error);
                  setStates([]); // Clear states on error
              } else {
                  const fetchedStates = data || [];
                  setStates(fetchedStates); // Update the states list

                  // *** ADDED FIX ***
                  // Check if the currently selected stateId exists in the new list
                  // If not (e.g., region changed and old state is invalid), reset stateId
                  const currentSelectedStateIsValid = fetchedStates.some(s => s.state_id === stateId);
                  if (!currentSelectedStateIsValid && stateId) {
                      console.log(`Region changed or initial load completed. Resetting invalid stateId: ${stateId}`);
                      setStateId(''); // Reset the selected state
                  }
              }
          } catch (err) {
              console.error(`Unexpected error fetching states:`, err);
              setStates([]);
          } finally {
              setIsLoadingStates(false); // Stop loading indicator
          }
      };

      fetchStatesForRegion(); // Execute the fetch function

  }, [selectedRegionId, supabase, mode, stateId]); // Ensure stateId is in dependencies

  // Remove RevenueCat Initialization useEffect
  // useEffect(() => { /* ... RC init logic ... */ }, [supabase]);

  // --- Event Handlers (Filled In) --- 
   const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIconFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setIconPreview(reader.result as string); };
            reader.readAsDataURL(file);
        } else { 
            setIconFile(null); 
            setIconPreview(existingIconUrl.current);
        }
   };
   const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
       setDailyHours(prev => ({ ...prev, [day]: { ...prev[day], [type]: value } }));
   };
   const handleClosedChange = (day: string, checked: boolean | 'indeterminate') => {
       const isClosed = typeof checked === 'boolean' ? checked : false;
       setDailyHours(prev => ({ ...prev, [day]: { ...prev[day], isClosed: isClosed } }));
   };
   const handleAddService = () => {
        if (!currentServiceSelection) return;
        const serviceToAdd = allServices.find(s => s.service_id === currentServiceSelection);
        const isAlreadyAdded = selectedServices.some(s => s.service_id === currentServiceSelection);
        if (serviceToAdd && !isAlreadyAdded) {
            setSelectedServices(prev => [...prev, { ...serviceToAdd, price: '', custom_description: '' }]);
            setCurrentServiceSelection("");
        }
   };
   const handleRemoveService = (serviceIdToRemove: string) => {
        setSelectedServices(prev => prev.filter(s => s.service_id !== serviceIdToRemove));
   };
   const handleSelectedServiceChange = (serviceId: string, field: 'price' | 'custom_description', value: string) => {
     setSelectedServices(prev => 
       prev.map(service => 
         service.service_id === serviceId 
           ? { ...service, [field]: value } 
           : service
       )
     );
   };
   const selectedGodNames = useMemo(() => {
      return selectedGodIds
          .map(id => allGods.find(god => god.god_id === id)?.god_name)
          .filter((name): name is string => name !== undefined); // Use type guard
  }, [selectedGodIds, allGods]);

  // --- useFormState Hook ---
  // const [formState, formAction] = useFormState(formActionFn, initialFormState);

  // --- Effect to handle form submission result and redirect --- 
  useEffect(() => {
      if (formState?.success && formState.shouldRedirect && formState.redirectUrl) {
          console.log("Redirecting to Paywall:", formState.redirectUrl);
          setIsSubmitting(false); // Stop loading before redirect
          window.location.href = formState.redirectUrl; // Perform client-side redirect
      } else if (formState?.success && !formState.shouldRedirect) {
          // Handle success for non-redirect cases (e.g., TEMPLE type)
          // Server action already redirects, maybe show a success message briefly if needed?
          console.log("Form submitted successfully (server redirect expected):", formState.message);
          setIsSubmitting(false);
          // Optional: Show toast or message here
      } else if (formState && !formState.success && formState.message) {
          // Handle failure
          console.error("Form submission failed:", formState.message);
          setFormError(formState.message); // Display error message
          setIsSubmitting(false); // Stop loading
      }
  }, [formState]);

  // --- Submit Handler (Simplified) --- 
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); // Clear previous errors
    setIsSubmitting(true); // Start loading indicator

    const formData = new FormData(event.currentTarget);

    // Append necessary data not directly part of standard inputs
    if (iconFile) formData.append('iconFile', iconFile);
    else formData.delete('iconFile');
    
    // ---> ADDED: Set tagId based on listingType prop <--- 
    const tagIdValue = listingType === 'TEMPLE' ? '1' : '2';
    formData.set('tagId', tagIdValue);

    formData.set('religionIds', selectedReligionIds.join(','));
    formData.set('godIds', selectedGodIds.join(','));
    const openingHoursJson: Record<string, string> = {};
    Object.entries(dailyHours).forEach(([day, hours]) => {
        if (!hours.isClosed && hours.open && hours.close) {
            openingHoursJson[day.toLowerCase()] = `${hours.open}-${hours.close}`;
        }
    });
    formData.set('openingHours', JSON.stringify(openingHoursJson));
    formData.set('listingServicesData', JSON.stringify(selectedServices));

    // Call the server action directly
    console.log(`Submitting form data for ${listingType} to server action...`);
    formAction(formData);
  };

  // ---> UPDATED: Determine if fields are required based on listingType prop <--- 
  const isTemple = listingType === 'TEMPLE';
  const isProservice = listingType === 'PROSERVICE';

  // --- Render --- 
  return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Display Server Action/Form Errors */}
          {(formError || (formState && !formState.success && formState.message && !isSubmitting)) && (
              <Alert variant="destructive">
                <AlertTitle>錯誤</AlertTitle>
                <AlertDescription>{formError || formState?.message}</AlertDescription>
              </Alert>
          )}
          {/* Display Server Action Success Message (before potential redirect) */}
          {formState?.success && formState.message && (
              <Alert variant="default">
                { /* Optional: Add an icon like CheckCircle */ }
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
          )}
          
          {/* Hidden input for listingId in edit mode */} 
          {mode === 'edit' && initialData?.listing_id && (
              <input type="hidden" name="listingId" value={initialData.listing_id} />
          )}

          {/* Form Content - Use space-y within the form directly */}
          {/* Icon Upload */}
           <div className="space-y-2">
              <Label htmlFor="icon-upload">列表圖標 (Listing Icon)</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                  {iconPreview ? (
                    <Image src={iconPreview} alt="Icon preview" width={80} height={80} className="object-cover" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('icon-upload')?.click()}>
                  上傳圖片
                </Button>
                <Input id="icon-upload" name="iconFileInput" type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                {iconFile && <span className="text-sm text-muted-foreground truncate max-w-[150px]">{iconFile.name}</span>}
                {iconPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setIconFile(null); setIconPreview(existingIconUrl.current); const input = document.getElementById('icon-upload') as HTMLInputElement; if(input) input.value = ''; }}>移除</Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">上傳一個方形圖標。</p>
           </div>
           {/* Display the determined type (optional) */}
           <div className="space-y-2">
               <Label>列表類型 (Listing Type)</Label>
               <Badge 
                   variant={listingType === 'TEMPLE' ? 'default' : 'secondary'} 
                   className={cn(
                       listingType === 'PROSERVICE' && 'badge-proservice' // Add custom class
                   )}
               >
                   {listingType}
               </Badge>
           </div>
          {/* Name */}
           <div className="space-y-2">
              <Label htmlFor="name">名稱 <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" placeholder="輸入列表名稱" value={name} onChange={(e) => setName(e.target.value)} required />
           </div>
          {/* Description */}
           <div className="space-y-2">
              <Label htmlFor="description">描述 <span className="text-red-500">*</span></Label>
              <Textarea id="description" name="description" placeholder="輸入列表描述" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
           </div>
          {/* Religions & Gods */}
           <h3 className="text-lg font-medium border-t pt-4">宗教與神祇</h3>
           <div className="space-y-2">
              <Label>宗教 {isTemple && <span className="text-red-500">*</span>}{isProservice && <span className="text-red-500">*</span>}</Label>
              {isLoadingReligions ? (<p>...</p>) : (
                   <ToggleGroup type="multiple" value={selectedReligionIds} onValueChange={setSelectedReligionIds} className="flex flex-wrap gap-2 justify-start">
                       {allReligions.map((r) => (<ToggleGroupItem key={r.religion_id} value={r.religion_id} aria-label={r.religion_name} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{r.religion_name}</ToggleGroupItem>))}
                   </ToggleGroup>
               )}
              <input type="hidden" name="religionIds" value={selectedReligionIds.join(',')} />
           </div>
           <div className="space-y-2">
              <Label>主要神祇 {isTemple && <span className="text-red-500">*</span>}</Label>
               <Popover open={isGodComboboxOpen} onOpenChange={setIsGodComboboxOpen}>
                  <PopoverTrigger disabled={isLoadingGods} className="w-full">
                       <Button 
                            variant="outline" 
                            role="combobox" 
                            aria-expanded={isGodComboboxOpen} 
                            className="w-full justify-between font-normal" 
                        >
                           {selectedGodIds.length > 0 ? `${selectedGodIds.length} selected` : "選擇神祇..."}
                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                    </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command filter={(v, s) => allGods.find(g => g.god_name.toLowerCase() === v.toLowerCase())?.god_name.toLowerCase().includes(s.toLowerCase()) ? 1 : 0}>
                      <CommandInput placeholder="搜索神祇..." /><CommandList>
                        <CommandEmpty>{isLoadingGods ? "載入中..." : "找不到."}</CommandEmpty><CommandGroup>
                          {allGods.map((god) => (<CommandItem key={god.god_id} value={god.god_name} onSelect={(val) => { const sel = allGods.find(g => g.god_name.toLowerCase() === val.toLowerCase()); if(sel && !selectedGodIds.includes(sel.god_id)) setSelectedGodIds(p => [...p, sel.god_id]); }}>{god.god_name}</CommandItem>))}
                        </CommandGroup></CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedGodNames.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">{selectedGodNames.map((n, i) => (<Badge key={i} variant="secondary">{n}<button type="button" onClick={() => setSelectedGodIds(p => p.filter((_, idx) => idx !== i))}><X/></button></Badge>))}</div>)}
               <input type="hidden" name="godIds" value={selectedGodIds.join(',')} />
           </div>
          {/* Location & Contact */}
           <h3 className="text-lg font-medium border-t pt-4">地點與聯絡方式</h3>
           <div className="space-y-2">
              <Label htmlFor="location">地點 <span className="text-red-500">*</span></Label>
              <Input id="location" name="location" placeholder="輸入完整地址" value={location} onChange={(e) => setLocation(e.target.value)} required />
           </div>
           <div className="space-y-2">
              <Label>區域 <span className="text-red-500">*</span></Label>
               {isLoadingRegions ? (<p>...</p>) : (
                   <ToggleGroup type="single" value={selectedRegionId ?? ''} onValueChange={(v) => {if (v) setSelectedRegionId(v); else setSelectedRegionId(null);}} className="flex flex-wrap gap-2 justify-start">
                       {regionsList.map((r) => (<ToggleGroupItem key={r.region_id} value={r.region_id} aria-label={r.region_name} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{r.region_name}</ToggleGroupItem>))}
                   </ToggleGroup>
               )}
           </div>
           <div className="space-y-2">
              <Label>州/地區 <span className="text-red-500">*</span></Label>
               <input type="hidden" name="stateId" value={stateId} />
               <Popover open={isStateComboboxOpen} onOpenChange={setIsStateComboboxOpen}>
                   <PopoverTrigger disabled={!selectedRegionId || isLoadingStates} className="w-full">
                       <Button 
                            variant="outline" 
                            role="combobox" 
                            aria-expanded={isStateComboboxOpen} 
                            className="w-full justify-between font-normal" 
                        >
                           {stateId ? states.find(s => s.state_id === stateId)?.state_name : (selectedRegionId ? "選擇州/地區..." : "請先選擇區域")}
                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                    </PopoverTrigger>
                   <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                     <Command filter={(v, s) => states.find(st => st.state_name.toLowerCase() === v.toLowerCase())?.state_name.toLowerCase().includes(s.toLowerCase()) ? 1 : 0}>
                       <CommandInput placeholder="搜索州/地區..." /><CommandList>
                         <CommandEmpty>{isLoadingStates ? "載入中..." : (!selectedRegionId ? "請先選擇區域." : "找不到.")}</CommandEmpty><CommandGroup>
                           {states.map((s) => (<CommandItem key={s.state_id} value={s.state_name} onSelect={(val) => { const sel = states.find(st => st.state_name.toLowerCase() === val.toLowerCase()); if(sel) setStateId(sel.state_id === stateId ? '' : sel.state_id); setIsStateComboboxOpen(false); }}> <Check className={cn("mr-2 h-4 w-4", stateId === s.state_id ? "opacity-100" : "opacity-0")} /> {s.state_name}</CommandItem>))}
                         </CommandGroup></CommandList>
                     </Command>
                   </PopoverContent>
                 </Popover>
           </div>
           <div className="space-y-2">
              <Label htmlFor="googleMapLink">Google 地圖連結</Label>
              <Input id="googleMapLink" name="googleMapLink" type="url" placeholder="輸入 Google 地圖分享連結" value={googleMapLink} onChange={(e) => setGoogleMapLink(e.target.value)} />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="lat">緯度</Label><Input id="lat" name="lat" type="number" step="any" placeholder="例如 3.1390" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))} /></div>
              <div className="space-y-2"><Label htmlFor="lng">經度</Label><Input id="lng" name="lng" type="number" step="any" placeholder="例如 101.6869" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))} /></div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="phone">電話 {isProservice && <span className="text-red-500">*</span>}</Label><Input id="phone" name="phone" type="tel" placeholder="輸入電話號碼" value={phone} onChange={(e) => setPhone(e.target.value)} required={isProservice} /></div>
              <div className="space-y-2"><Label htmlFor="email">電子郵件 {isProservice && <span className="text-red-500">*</span>}</Label><Input id="email" name="email" type="email" placeholder="輸入電子郵件地址" value={email} onChange={(e) => setEmail(e.target.value)} required={isProservice} /></div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="website">網站</Label><Input id="website" name="website" type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="facebook">Facebook</Label><Input id="facebook" name="facebook" type="url" placeholder="輸入 Facebook 頁面連結" value={facebook} onChange={(e) => setFacebook(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="instagram">Instagram</Label><Input id="instagram" name="instagram" type="url" placeholder="輸入 Instagram 頁面連結" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" name="whatsapp" placeholder="輸入 WhatsApp 號碼/連結" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
           </div>
           <div className="space-y-2">
              <Label htmlFor="xiaohongshu">小红书</Label><Input id="xiaohongshu" name="xiaohongshu" type="url" placeholder="输入小红书主页链接" value={xiaohongshu} onChange={(e) => setXiaohongshu(e.target.value)} />
           </div>

           {/* Other Info */}
            <h3 className="text-lg font-medium border-t pt-4">其他信息</h3>
            <div className="space-y-3">
               <Label>營業時間 (Mon-Sun)</Label>
                {Object.entries(dailyHours).map(([day, hours]) => (
                   <div key={day} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-x-3 gap-y-1">
                     <span className="text-sm font-medium">{day}</span>
                     <Input type="time" aria-label={`${day} open`} value={hours.open} onChange={(e) => handleTimeChange(day, 'open', e.target.value)} disabled={hours.isClosed} className="text-sm h-8" />
                     <Input type="time" aria-label={`${day} close`} value={hours.close} onChange={(e) => handleTimeChange(day, 'close', e.target.value)} disabled={hours.isClosed} className="text-sm h-8" />
                     <div className="flex items-center space-x-2 justify-self-end"><Checkbox id={`c-${day}`} checked={hours.isClosed} onCheckedChange={(c) => handleClosedChange(day, c)} aria-label={`${day} closed`}/><Label htmlFor={`c-${day}`} className="text-xs">休息</Label></div>
                   </div>
                 ))}
                <input type="hidden" name="openingHours" />
            </div>

            {/* Services Section */} 
            <h3 className="text-lg font-medium border-t pt-4">提供服務</h3>
            <div className="space-y-2">
                <Label>添加服務 {isProservice && <span className="text-red-500">*</span>}</Label>
                <div className="flex items-center gap-2">
                   <Popover open={isServiceComboboxOpen} onOpenChange={setIsServiceComboboxOpen}>
                       <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-[250px] justify-between font-normal" disabled={isLoadingServices}>{currentServiceSelection ? allServices.find(s => s.service_id === currentServiceSelection)?.service_name : "選擇服務..."}<ChevronsUpDown /></Button></PopoverTrigger>
                       <PopoverContent className="w-[250px] p-0">
                         <Command filter={(v, s) => allServices.find(sv => sv.service_name.toLowerCase() === v.toLowerCase())?.service_name.toLowerCase().includes(s.toLowerCase()) ? 1 : 0}>
                           <CommandInput placeholder="搜索服務..." /><CommandList>
                             <CommandEmpty>{isLoadingServices ? "載入中..." : "找不到."}</CommandEmpty><CommandGroup>
                               {allServices.map((s) => (<CommandItem key={s.service_id} value={s.service_name} onSelect={(val) => { const sel = allServices.find(sv => sv.service_name.toLowerCase() === val.toLowerCase()); if(sel)setCurrentServiceSelection(sel.service_id === currentServiceSelection ? "" : sel.service_id); setIsServiceComboboxOpen(false);}}><Check className={cn("mr-2 h-4 w-4", currentServiceSelection === s.service_id ? "o-100" : "o-0")} />{s.service_name}</CommandItem>))}
                             </CommandGroup></CommandList>
                         </Command>
                       </PopoverContent>
                     </Popover>
                     <Button type="button" onClick={handleAddService} disabled={!currentServiceSelection || selectedServices.some(s => s.service_id === currentServiceSelection)}>添加</Button>
                </div>
            </div>
            {selectedServices.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                     <Label>已選服務詳情</Label>
                     {selectedServices.map((s, i) => (
                         <div key={s.service_id} className="p-3 border rounded-md space-y-2 relative bg-muted/40">
                             <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveService(s.service_id)}><Trash2 className="h-4 w-4"/></Button>
                             <p className="font-medium text-sm">{s.service_name}</p>
                             <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2">
                                 <div className="space-y-1"><Label className="text-xs" htmlFor={`s-p-${i}`}>價格</Label><Input id={`s-p-${i}`} type="number" placeholder="e.g., 180" value={s.price} onChange={(e) => handleSelectedServiceChange(s.service_id, 'price', e.target.value)} className="h-8 text-sm"/></div>
                                 <div className="space-y-1"><Label className="text-xs" htmlFor={`s-d-${i}`}>自定義描述</Label><Textarea id={`s-d-${i}`} placeholder="Specific notes" value={s.custom_description} onChange={(e) => handleSelectedServiceChange(s.service_id, 'custom_description', e.target.value)} rows={1} className="text-sm resize-y min-h-[32px]"/></div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
            <input type="hidden" name="listingServicesData" />
            
          {/* Form Footer for Submit Button */}
          <div className="flex justify-end pt-6 border-t">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            處理中...
                        </>
                    ) : (mode === 'create' ? '提交創建' : '儲存更改')}
                </Button>
          </div>
      </form>
  );
} 