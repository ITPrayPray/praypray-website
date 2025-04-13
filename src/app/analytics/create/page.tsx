'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UploadCloud, Check, ChevronsUpDown, Loader2, X, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createListingAction } from './actions';

interface State {
  state_id: string;
  state_name: string;
}

interface Region {
  region_id: string;
  region_name: string;
}

interface Religion {
  religion_id: string;
  religion_name: string;
}

interface God {
  god_id: string;
  god_name: string;
}

interface DayHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  isClosed: boolean;
}

interface Service {
  service_id: string;
  service_name: string;
}

interface SelectedService extends Service {
  price: string; // Keep as string for input control
  custom_description: string;
}

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? '提交中... (Submitting...)' : '提交 (Submit)'}
    </Button>
  );
}

export default function CreateListingPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | '' >('');
  const [lng, setLng] = useState<number | '' >('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [xiaohongshu, setXiaohongshu] = useState('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [stateId, setStateId] = useState('');
  const [tagId, setTagId] = useState('');

  const [regionsList, setRegionsList] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [isStateComboboxOpen, setIsStateComboboxOpen] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  const [allReligions, setAllReligions] = useState<Religion[]>([]);
  const [selectedReligionIds, setSelectedReligionIds] = useState<string[]>([]);
  const [isLoadingReligions, setIsLoadingReligions] = useState(true);

  const [allGods, setAllGods] = useState<God[]>([]);
  const [selectedGodIds, setSelectedGodIds] = useState<string[]>([]);
  const [isGodComboboxOpen, setIsGodComboboxOpen] = useState(false);
  const [isLoadingGods, setIsLoadingGods] = useState(true);

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]); // Array of selected services with details
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [currentServiceSelection, setCurrentServiceSelection] = useState<string>(""); // Holds service_id from combobox
  const [isServiceComboboxOpen, setIsServiceComboboxOpen] = useState(false);

  const [formState, formAction] = useFormState(createListingAction, initialState);

  const initialDailyHours: Record<string, DayHours> = {
    Monday: { open: '09:00', close: '17:00', isClosed: false },
    Tuesday: { open: '09:00', close: '17:00', isClosed: false },
    Wednesday: { open: '09:00', close: '17:00', isClosed: false },
    Thursday: { open: '09:00', close: '17:00', isClosed: false },
    Friday: { open: '09:00', close: '17:00', isClosed: false },
    Saturday: { open: '09:00', close: '17:00', isClosed: true },
    Sunday: { open: '09:00', close: '17:00', isClosed: true },
  };
  const [dailyHours, setDailyHours] = useState<Record<string, DayHours>>(initialDailyHours);

  // Determine if TEMPLE or PROSERVICE is selected
  const isTemple = tagId === '1';
  const isProservice = tagId === '2';

  useEffect(() => {
    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const { data, error } = await supabase
          .from('regions')
          .select('region_id, region_name')
          .order('region_name', { ascending: true });
        if (error) {
          console.error('Error fetching regions:', error);
        } else {
          setRegionsList(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching regions:', err);
      } finally {
        setIsLoadingRegions(false);
      }
    };
    fetchRegions();
  }, [supabase]);

  useEffect(() => {
    const fetchStatesForRegion = async () => {
      if (!selectedRegionId) {
        setStates([]);
        return;
      }
      setIsLoadingStates(true);
      setStateId('');
      try {
        const { data, error } = await supabase
          .from('states')
          .select('state_id, state_name')
          .eq('region_id', selectedRegionId)
          .order('state_name', { ascending: true });

        if (error) {
          console.error(`Error fetching states for region ${selectedRegionId}:`, error);
          setStates([]);
        } else {
          setStates(data || []);
        }
      } catch (err) {
        console.error(`Unexpected error fetching states for region ${selectedRegionId}:`, err);
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };

    fetchStatesForRegion();
  }, [selectedRegionId, supabase]);

  useEffect(() => {
    const fetchReligions = async () => {
      setIsLoadingReligions(true);
      try {
        const { data, error } = await supabase
          .from('religions')
          .select('religion_id, religion_name')
          .order('religion_name', { ascending: true });
        if (error) {
          console.error('Error fetching religions:', error);
        } else {
          setAllReligions(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching religions:', err);
      } finally {
        setIsLoadingReligions(false);
      }
    };
    fetchReligions();
  }, [supabase]);

  useEffect(() => {
    const fetchGods = async () => {
      setIsLoadingGods(true);
      try {
        const { data, error } = await supabase
          .from('gods')
          .select('god_id, god_name')
          .order('god_name', { ascending: true });
        if (error) {
          console.error('Error fetching gods:', error);
        } else {
          setAllGods(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching gods:', err);
      } finally {
        setIsLoadingGods(false);
      }
    };
    fetchGods();
  }, [supabase]);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        // Fetch only id and name initially
        const { data, error } = await supabase
          .from('services')
          .select('service_id, service_name') 
          .order('service_name', { ascending: true });
        if (error) {
          console.error('Error fetching services:', error);
        } else {
          setAllServices(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching services:', err);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, [supabase]);

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIconFile(null);
      setIconPreview(null);
    }
  };

  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
    setDailyHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const handleClosedChange = (day: string, checked: boolean | 'indeterminate') => {
    const isClosed = typeof checked === 'boolean' ? checked : false;
    setDailyHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isClosed: isClosed }
    }));
  };

  const handleAddService = () => {
    if (!currentServiceSelection) return; // No service selected in combobox
    const serviceToAdd = allServices.find(s => s.service_id === currentServiceSelection);
    // Check if already added
    const isAlreadyAdded = selectedServices.some(s => s.service_id === currentServiceSelection);

    if (serviceToAdd && !isAlreadyAdded) {
      setSelectedServices(prev => [
        ...prev,
        { 
          ...serviceToAdd, // service_id, service_name
          price: '', // Default empty price
          custom_description: '' // Default empty description
        }
      ]);
      setCurrentServiceSelection(""); // Reset combobox selection state
      // We might need to manually clear the Combobox input display value if it uses a separate state
    }
  };

  const handleRemoveService = (serviceIdToRemove: string) => {
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceIdToRemove));
  };

  const handleSelectedServiceChange = (
      serviceId: string, 
      field: 'price' | 'custom_description', 
      value: string
  ) => {
    setSelectedServices(prev => 
      prev.map(service => 
        service.service_id === serviceId 
          ? { ...service, [field]: value } 
          : service
      )
    );
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (iconFile) {
      formData.append('iconFile', iconFile);
    }
    formData.set('religionIds', selectedReligionIds.join(','));
    formData.set('godIds', selectedGodIds.join(','));

    const openingHoursJson: Record<string, string> = {};
    Object.entries(dailyHours).forEach(([day, hours]) => {
      if (!hours.isClosed && hours.open && hours.close) {
        openingHoursJson[day] = `${hours.open}-${hours.close}`;
      }
    });
    formData.set('openingHours', JSON.stringify(openingHoursJson));

    // Append selected services data as JSON string
    formData.set('listingServicesData', JSON.stringify(selectedServices));

    // Ensure tagId hidden input value is set correctly by the ToggleGroup binding
    formData.set('tagId', tagId);

    formAction(formData);
  };

  const selectedGodNames = useMemo(() => {
    return selectedGodIds
      .map(id => allGods.find(god => god.god_id === id)?.god_name)
      .filter(name => name !== undefined) as string[];
  }, [selectedGodIds, allGods]);

  return (
    <div className="p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/analytics">數據分析 (Analytics)</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>創建 (Create)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>創建新列表 (Create New Listing)</CardTitle>
          <CardDescription>請填寫以下詳細信息以創建您的列表。(Fill in the details below to create your listing.)</CardDescription>
          {formState?.message && (
            <p className={`mt-2 text-sm ${formState.success ? 'text-green-600' : 'text-red-600'}`}>
              {formState.message}
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleFormSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icon-upload">列表圖標 (Listing Icon)</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                  {iconPreview ? (
                    <Image
                      src={iconPreview}
                      alt="Icon preview"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('icon-upload')?.click()}>
                  上傳圖片 (Upload Image)
                </Button>
                <Input
                  id="icon-upload"
                  name="iconFileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
                 {iconFile && <span className="text-sm text-muted-foreground truncate max-w-[150px]">{iconFile.name}</span>}
                 {iconPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setIconFile(null); setIconPreview(null); const input = document.getElementById('icon-upload') as HTMLInputElement; if(input) input.value = ''; }}>
                      移除 (Remove)
                    </Button>
                 )}
              </div>
              <p className="text-sm text-muted-foreground">上傳一個方形圖標。(Upload a square icon.)</p>
            </div>
            <div className="space-y-2">
              <Label>列表類型 (Listing Type) <span className="text-red-500">*</span></Label>
              <ToggleGroup
                  type="single"
                  value={tagId}
                  onValueChange={(value) => {
                      if (value) {
                          setTagId(value);
                      } else {
                          // Optionally handle deselection, e.g., clear or keep previous
                          // For a required field, maybe don't allow deselection?
                          // setTagId(''); // Or keep the value if deselection isn't intended
                      }
                  }}
                  className="flex flex-wrap gap-2 justify-start"
                  aria-required="true"
              >
                  <ToggleGroupItem key="1" value="1" aria-label="Select TEMPLE" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      TEMPLE
                  </ToggleGroupItem>
                  <ToggleGroupItem key="2" value="2" aria-label="Select PROSERVICE" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      PROSERVICE
                  </ToggleGroupItem>
              </ToggleGroup>
              <input type="hidden" name="tagId" value={tagId} />
              <p className="text-sm text-muted-foreground">請選擇列表類型。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">名稱 (Name) <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="輸入列表名稱 (Enter listing name)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述 (Description) <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                name="description"
                placeholder="輸入列表描述 (Enter listing description)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <h3 className="text-lg font-medium border-t pt-4">宗教與神祇 (Religions & Gods)</h3>
            <div className="space-y-2">
              <Label>宗教 (Religions) <span className="text-red-500">*</span></Label>
              {isLoadingReligions ? (
                  <p className="text-sm text-muted-foreground">載入宗教中... (Loading religions...)</p>
              ) : (
                  <ToggleGroup
                      type="multiple"
                      value={selectedReligionIds}
                      onValueChange={(value: string[]) => {
                          setSelectedReligionIds(value);
                      }}
                      className="flex flex-wrap gap-2 justify-start"
                  >
                      {allReligions.map((religion) => (
                          <ToggleGroupItem 
                              key={religion.religion_id} 
                              value={religion.religion_id} 
                              aria-label={`Select ${religion.religion_name}`}
                              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          >
                              {religion.religion_name}
                          </ToggleGroupItem>
                      ))}
                  </ToggleGroup>
              )}
              <input type="hidden" name="religionIds" value={selectedReligionIds.join(',')} />
            </div>
            <div className="space-y-2">
              <Label>主要神祇 (Main Gods) {isTemple && <span className="text-red-500">*</span>}</Label>
              <Popover open={isGodComboboxOpen} onOpenChange={setIsGodComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isGodComboboxOpen}
                    className="w-full justify-between font-normal"
                    disabled={isLoadingGods}
                  >
                    {selectedGodIds.length > 0 
                      ? `${selectedGodIds.length} 個已選擇 (selected)`
                      : "選擇神祇... (Select gods...)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command filter={(value, search) => { 
                       const god = allGods.find(g => g.god_name.toLowerCase() === value.toLowerCase());
                       if (god && god.god_name.toLowerCase().includes(search.toLowerCase())) return 1;
                       return 0;
                  }}>
                    <CommandInput placeholder="搜索神祇... (Search gods...)" />
                    <CommandList>
                      <CommandEmpty>{isLoadingGods ? "載入中..." : "找不到神祇."}</CommandEmpty>
                      <CommandGroup>
                        {allGods.map((god) => (
                          <CommandItem
                            key={god.god_id}
                            value={god.god_name}
                            onSelect={(currentValue) => {
                              const selected = allGods.find(g => g.god_name.toLowerCase() === currentValue.toLowerCase());
                              if (selected) {
                                  if (!selectedGodIds.includes(selected.god_id)) {
                                      setSelectedGodIds(prev => [...prev, selected.god_id]);
                                  }
                              }
                            }}
                          >
                            {god.god_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedGodNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedGodNames.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                      <button 
                        type="button"
                        aria-label={`Remove ${name}`}
                        onClick={() => {
                          const godIdToRemove = selectedGodIds[index];
                          setSelectedGodIds(prev => prev.filter(id => id !== godIdToRemove));
                        }}
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                         <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <input type="hidden" name="godIds" value={selectedGodIds.join(',')} />
            </div>
            <h3 className="text-lg font-medium border-t pt-4">地點與聯絡方式 (Location & Contact)</h3>
            <div className="space-y-2">
              <Label htmlFor="location">地點 (Location) <span className="text-red-500">*</span></Label>
              <Input
                id="location"
                name="location"
                placeholder="輸入完整地址 (Enter full address)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>區域 (Region) <span className="text-red-500">*</span></Label>
              {isLoadingRegions ? (
                  <p className="text-sm text-muted-foreground">載入區域中... (Loading regions...)</p>
              ) : (
                  <ToggleGroup
                      type="single"
                      value={selectedRegionId ?? ''}
                      onValueChange={(value: string) => {
                          if (value) { setSelectedRegionId(value); } else { setSelectedRegionId(null); }
                      }}
                      className="flex flex-wrap gap-2 justify-start"
                  >
                      {regionsList.map((region) => (
                          <ToggleGroupItem 
                              key={region.region_id} 
                              value={region.region_id} 
                              aria-label={`Select ${region.region_name}`}
                              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          >
                              {region.region_name}
                          </ToggleGroupItem>
                      ))}
                  </ToggleGroup>
              )}
            </div>
            <div className="space-y-2">
              <Label>州/地區 (State) <span className="text-red-500">*</span></Label>
              <input type="hidden" name="stateId" value={stateId} />
              <Popover open={isStateComboboxOpen} onOpenChange={setIsStateComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isStateComboboxOpen}
                    className="w-full justify-between font-normal"
                    disabled={!selectedRegionId || isLoadingStates}
                  >
                    {stateId
                      ? states.find((state) => state.state_id === stateId)?.state_name
                      : (selectedRegionId ? "選擇州/地區... (Select state...)" : "請先選擇區域 (Select region first)")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command filter={(value, search) => {
                      const state = states.find(s => s.state_name.toLowerCase() === value.toLowerCase());
                      if (state && state.state_name.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}>
                    <CommandInput placeholder="搜索州/地區... (Search state...)" />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingStates ? "載入中... (Loading...)" 
                         : (!selectedRegionId ? "請先選擇一個區域。(Please select a region first.)" 
                         : "找不到州/地區。(No state found.)")}
                      </CommandEmpty>
                      <CommandGroup>
                        {states.map((state) => (
                          <CommandItem
                            key={state.state_id}
                            value={state.state_name}
                            onSelect={(currentValue) => {
                              const selected = states.find(s => s.state_name.toLowerCase() === currentValue.toLowerCase());
                              if (selected) {
                                setStateId(selected.state_id === stateId ? '' : selected.state_id);
                              } else {
                                setStateId('');
                              }
                              setIsStateComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                stateId === state.state_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {state.state_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                     </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleMapLink">Google 地圖連結 (Google Map Link)</Label>
              <Input
                id="googleMapLink"
                name="googleMapLink"
                type="url"
                placeholder="輸入 Google 地圖分享連結 (Enter Google Maps share link)"
                value={googleMapLink}
                onChange={(e) => setGoogleMapLink(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">緯度 (Latitude)</Label>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  placeholder="例如 3.1390"
                  value={lat}
                  onChange={(e) => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">經度 (Longitude)</Label>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  placeholder="例如 101.6869"
                  value={lng}
                  onChange={(e) => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>
            </div>
            <h3 className="text-lg font-medium border-t pt-4">聯絡方式 (Contact Information)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">電話 (Phone) {isProservice && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="輸入電話號碼 (Enter phone number)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件 (Email) {isProservice && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="輸入電子郵件地址 (Enter email address)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">網站 (Website)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="輸入 WhatsApp 號碼/連結"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  name="facebook"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="xiaohongshu">小红书 (Xiaohongshu)</Label>
              <Input
                id="xiaohongshu"
                name="xiaohongshu"
                type="url"
                placeholder="输入小红书主页链接 (Enter Xiaohongshu profile link)"
                value={xiaohongshu}
                onChange={(e) => setXiaohongshu(e.target.value)}
              />
            </div>
            <h3 className="text-lg font-medium border-t pt-4">其他信息 (Other Information)</h3>
            
            <div className="space-y-3">
              <Label>營業時間 (Opening Hours - Mon-Fri)</Label>
              {Object.entries(dailyHours).map(([day, hours]) => (
                <div key={day} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium">{day}</span>
                  <Input
                    type="time"
                    aria-label={`${day} opening time`}
                    value={hours.open}
                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    disabled={hours.isClosed}
                    className="text-sm h-8"
                  />
                  <Input
                    type="time"
                    aria-label={`${day} closing time`}
                    value={hours.close}
                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    disabled={hours.isClosed}
                    className="text-sm h-8"
                  />
                   <div className="flex items-center space-x-2 justify-self-end">
                        <Checkbox
                            id={`closed-${day}`}
                            checked={hours.isClosed}
                            onCheckedChange={(checked) => handleClosedChange(day, checked)}
                            aria-label={`${day} closed`}
                         />
                         <Label htmlFor={`closed-${day}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                             休息 (Closed) / 不定時 (Depends)
                         </Label>
                    </div>
                </div>
              ))}
               <input type="hidden" name="openingHours" /> 
            </div>

            {/* Services Section */}
            <h3 className="text-lg font-medium border-t pt-4">提供服務 (Services Offered)</h3>
            <div className="space-y-2">
                <Label>添加服務 (Add Service) {isProservice && <span className="text-red-500">*</span>}</Label>
                <div className="flex items-center gap-2">
                    {/* Service Selection Combobox */}
                    <Popover open={isServiceComboboxOpen} onOpenChange={setIsServiceComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isServiceComboboxOpen}
                                className="w-[250px] justify-between font-normal" // Adjust width as needed
                                disabled={isLoadingServices}
                            >
                                {currentServiceSelection
                                    ? allServices.find((s) => s.service_id === currentServiceSelection)?.service_name
                                    : "選擇服務... (Select service...)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0"> {/* Match trigger width */} 
                            <Command filter={(value, search) => {
                                const service = allServices.find(s => s.service_name.toLowerCase() === value.toLowerCase());
                                if (service && service.service_name.toLowerCase().includes(search.toLowerCase())) return 1;
                                return 0;
                            }}>
                                <CommandInput placeholder="搜索服務... (Search service...)" />
                                <CommandList>
                                <CommandEmpty>{isLoadingServices ? "載入中..." : "找不到服務."}</CommandEmpty>
                                <CommandGroup>
                                    {allServices.map((service) => (
                                    <CommandItem
                                        key={service.service_id}
                                        value={service.service_name} // Use name for filtering
                                        onSelect={(currentValue) => {
                                            const selected = allServices.find(s => s.service_name.toLowerCase() === currentValue.toLowerCase());
                                            if (selected) {
                                                 // Update the temporary selection state
                                                 setCurrentServiceSelection(selected.service_id === currentServiceSelection ? "" : selected.service_id);
                                            }
                                            setIsServiceComboboxOpen(false); // Close popover on select
                                        }}
                                    >
                                        <Check
                                            className={cn("mr-2 h-4 w-4",
                                            currentServiceSelection === service.service_id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {service.service_name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Add Service Button */}
                    <Button 
                        type="button" 
                        onClick={handleAddService}
                        disabled={!currentServiceSelection || selectedServices.some(s => s.service_id === currentServiceSelection)} // Disable if no selection or already added
                    >
                        添加 (Add)
                    </Button>
                </div>
            </div>

            {/* List of Selected Services */} 
            {selectedServices.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                    <Label>已選服務詳情 (Selected Service Details)</Label>
                    {selectedServices.map((service, index) => (
                        <div key={service.service_id} className="p-3 border rounded-md space-y-2 relative bg-muted/40">
                            <Button 
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => handleRemoveService(service.service_id)}
                                aria-label={`Remove ${service.service_name}`}
                             >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                            <p className="font-medium text-sm">{service.service_name}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor={`service-price-${index}`} className="text-xs">價格 (Price)</Label>
                                    <Input 
                                        id={`service-price-${index}`}
                                        name={`service_${service.service_id}_price`} // Unique name might be helpful, but we use state
                                        type="number"
                                        placeholder="例如 180" 
                                        value={service.price}
                                        onChange={(e) => handleSelectedServiceChange(service.service_id, 'price', e.target.value)}
                                        className="h-8 text-sm"
                                     />
                                </div>
                                <div className="space-y-1">
                                     <Label htmlFor={`service-desc-${index}`} className="text-xs">自定義描述 (Custom Desc.)</Label>
                                     <Textarea 
                                        id={`service-desc-${index}`}
                                        name={`service_${service.service_id}_desc`} 
                                        placeholder="此列表的特別說明 (Notes specific to this listing)"
                                        value={service.custom_description}
                                        onChange={(e) => handleSelectedServiceChange(service.service_id, 'custom_description', e.target.value)}
                                        rows={1}
                                        className="text-sm resize-y min-h-[32px]"
                                      />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Hidden input to pass data */}
            <input type="hidden" name="listingServicesData" />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 