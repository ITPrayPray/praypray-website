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
import { UploadCloud, Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure they are set in your .env.local file.");
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [stateId, setStateId] = useState('');
  const [tagId, setTagId] = useState('');
  const [servicesInput, setServicesInput] = useState('');

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

  useEffect(() => {
    const fetchRegions = async () => {
      if (!supabase) return;
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
  }, []);

  useEffect(() => {
    const fetchStatesForRegion = async () => {
      if (!supabase || !selectedRegionId) {
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
  }, [selectedRegionId]);

  useEffect(() => {
    const fetchReligions = async () => {
      if (!supabase) return;
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
  }, []);

  useEffect(() => {
    const fetchGods = async () => {
      if (!supabase) return;
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
  }, []);

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
              <Label htmlFor="name">名稱 (Name)</Label>
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
              <Label htmlFor="description">描述 (Description)</Label>
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
              <Label>宗教 (Religions)</Label>
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
                          <ToggleGroupItem key={religion.religion_id} value={religion.religion_id} aria-label={`Select ${religion.religion_name}`}>
                              {religion.religion_name}
                          </ToggleGroupItem>
                      ))}
                  </ToggleGroup>
              )}
              <input type="hidden" name="religionIds" value={selectedReligionIds.join(',')} />
            </div>
            <div className="space-y-2">
              <Label>主要神祇 (Main Gods)</Label>
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
              <Label htmlFor="location">地點 (Location)</Label>
              <Input
                id="location"
                name="location"
                placeholder="輸入完整地址 (Enter full address)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>區域 (Region)</Label>
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
                          <ToggleGroupItem key={region.region_id} value={region.region_id} aria-label={`Select ${region.region_name}`}>
                              {region.region_name}
                          </ToggleGroupItem>
                      ))}
                  </ToggleGroup>
              )}
            </div>
            <div className="space-y-2">
              <Label>州/地區 (State)</Label>
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
                <Label htmlFor="phone">電話 (Phone)</Label>
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
                <Label htmlFor="email">電子郵件 (Email)</Label>
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
                             休息 (Closed)
                         </Label>
                    </div>
                </div>
              ))}
               <input type="hidden" name="openingHours" /> 
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicesInput">服務 (Services)</Label>
              <Textarea
                id="servicesInput"
                name="servicesInput"
                placeholder="輸入服務信息 (MVP 階段暫不處理)"
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                rows={4}
                disabled
              />
              <p className="text-sm text-muted-foreground">MVP 階段暫不處理此欄位。</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagId">標籤 ID (Tag ID) <span className="text-red-500">*</span></Label>
              <Input
                id="tagId"
                name="tagId"
                placeholder="輸入標籤 ID (未來使用下拉選單)"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">此為必填項。未來將改為下拉選單。</p>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 