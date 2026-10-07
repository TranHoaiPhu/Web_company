"use client"

import { useState, useEffect, memo, useCallback } from 'react';
import { tourService } from '@/services/tour.service';
import { metaService, Location, Category } from '@/services/meta.service';
import { Save, Plus, Trash2, Image as ImageIcon, Calendar, MapPin, Star, ChevronDown, ChevronUp, Map, Loader2, Check, AlertCircle, Info, Upload, X, Eye, EyeOff, Sparkles, Clock, Users, DollarSign, FileText, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LocationPickerModal from '@/components/maps/LocationPickerModal';
import PlacePickerModal from '@/components/maps/PlacePickerModal';
import { uploadService } from '@/services/upload.service';
import TourPreviewModal from './TourPreviewModal';
import TourSuccessModal from './TourSuccessModal';

// ===================== TYPES =====================
interface Place {
  id: number;
  name: string;
  type?: string;
  locationName?: string;
}

interface Amenity {
  id: number;
  name: string;
  icon?: string;
  category?: string;
  description?: string;
}

interface TourImage {
  url: string;
  alt: string;
  isCover: boolean;
  order: number;
}

interface DayPlace {
  placeId: number;
  placeName?: string;
  visitOrder: number;
  durationMinutes: number;
  notes: string;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  places: DayPlace[];
}

interface TourAmenity {
  amenityId: number;
  amenityName?: string;
  price: number;
  isIncluded: boolean;
  isOptional: boolean;
}

interface TourSchedule {
  startDate: string;
  endDate: string;
  priceOverride: number;
  totalSlots: number;
  availableSlots: number;
  status: 'OPEN' | 'CLOSED' | 'FULL';
  notes: string;
}

interface TourFormData {
  name: string;
  slug: string;
  locationId: number | string;
  categoryId: number | string;
  shortDescription: string;
  description: string;
  highlights: string;
  includedServices: string;
  excludedServices: string;
  termsConditions: string;
  cancellationPolicy: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  childPrice: number;
  infantPrice: number;
  maxParticipants: number;
  minParticipants: number;
  difficultyLevel: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT';
  transportationType: string;
  departureLocation: string;
  returnLocation: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  isHotDeal: boolean;
  images: TourImage[];
  itinerary: ItineraryDay[];
  amenities: TourAmenity[];
  schedules: TourSchedule[];
}

// ===================== TOOLTIP COMPONENT =====================
const Tooltip = memo(function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ===================== PROGRESS BAR =====================
const ProgressBar = memo(function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành</span>
          <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

// ===================== SECTION COMPONENT =====================
interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isCompleted?: boolean;
  isRequired?: boolean;
}

const Section = memo(function Section({
  id,
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
  isCompleted = false,
  isRequired = false
}: SectionProps) {
  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 ${isOpen
      ? 'border-indigo-200 shadow-lg shadow-indigo-100/50'
      : 'border-gray-200/60 shadow-sm hover:border-indigo-100 hover:shadow-md'
      } bg-white overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${isOpen ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-gray-50/50 hover:bg-gray-100/50'
          }`}
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}>
            {icon}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {isRequired && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                  Bắt buộc
                </span>
              )}
              {isCompleted && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </button>
      {isOpen && (
        <div className="p-6 pt-4">
          {children}
        </div>
      )}
    </div>
  );
});

// ===================== FLOATING ACTION BUTTON =====================
const FloatingActions = memo(function FloatingActions({
  onSaveDraft,
  onPreview,
  onPublish,
  progress,
  isSubmitting
}: {
  onSaveDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
  progress: number;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      <div className="absolute bottom-full right-0 mb-4 hidden group-hover:block">
        <div className="rounded-lg bg-white p-3 shadow-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tiến độ</p>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <Tooltip text="Xem trước tour">
        <button
          type="button"
          onClick={onPreview}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-50 transition-all hover:scale-110 border border-gray-100"
        >
          <Eye className="h-6 w-6" />
        </button>
      </Tooltip>

      <Tooltip text="Lưu nháp">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg hover:bg-emerald-50 transition-all hover:scale-110 border border-emerald-100 disabled:opacity-50"
        >
          <Save className="h-6 w-6" />
        </button>
      </Tooltip>

      <button
        type="button"
        onClick={onPublish}
        disabled={isSubmitting}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl hover:shadow-indigo-200 transition-all hover:scale-110 disabled:opacity-50 group"
      >
        {isSubmitting ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <Zap className="h-7 w-7 fill-current" />
        )}
        <div className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
          XUẤT BẢN NGAY
        </div>
      </button>
    </div>
  );
});

// ===================== QUICK STATS =====================
const QuickStats = memo(function QuickStats({ formData }: { formData: TourFormData }) {
  const stats = [
    { label: 'Hình ảnh', value: formData.images.length, icon: ImageIcon, color: 'blue' },
    { label: 'Ngày tour', value: formData.itinerary.length, icon: Calendar, color: 'green' },
    { label: 'Địa điểm', value: formData.itinerary.reduce((sum, day) => sum + day.places.length, 0), icon: MapPin, color: 'purple' },
    { label: 'Lịch khởi hành', value: formData.schedules.length, icon: Clock, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 p-4 border border-${stat.color}-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 text-${stat.color}-400`} />
          </div>
        </div>
      ))}
    </div>
  );
});

// ===================== MAIN COMPONENT =====================
export default function TourFormComplete() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showPlaceMapPicker, setShowPlaceMapPicker] = useState(false);
  const [editingPlaceInfo, setEditingPlaceInfo] = useState<{ dayIndex: number; placeIndex: number } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdTourId, setCreatedTourId] = useState<number | string>('');

  // Accordion state - Start with essential sections open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    price: true,
    duration: false,
    description: false,
    transport: false,
    settings: false,
    images: false,
    itinerary: false,
    amenities: false,
    schedules: false,
  });

  const [formData, setFormData] = useState<TourFormData>({
    name: '',
    slug: '',
    locationId: '',
    categoryId: '',
    shortDescription: '',
    description: '',
    highlights: '',
    includedServices: '',
    excludedServices: '',
    termsConditions: '',
    cancellationPolicy: '',
    latitude: null,
    longitude: null,
    locationName: '',
    durationDays: 2,
    durationNights: 1,
    basePrice: 0,
    childPrice: 0,
    infantPrice: 0,
    maxParticipants: 30,
    minParticipants: 5,
    difficultyLevel: 'EASY',
    transportationType: 'BUS',
    departureLocation: '',
    returnLocation: '',
    status: 'DRAFT',
    isFeatured: false,
    isHotDeal: false,
    images: [],
    itinerary: [],
    amenities: [],
    schedules: [],
  });

  // Calculate completion progress
  const calculateProgress = useCallback(() => {
    let completed = 0;
    const total = 10;

    if (formData.name && formData.locationId && formData.categoryId) completed++;
    if (formData.basePrice > 0) completed++;
    if (formData.durationDays > 0) completed++;
    if (formData.shortDescription) completed++;
    if (formData.transportationType && formData.departureLocation) completed++;
    if (formData.images.length > 0) completed++;
    if (formData.itinerary.length > 0) completed++;
    if (formData.amenities.length > 0) completed++;
    if (formData.schedules.length > 0) completed++;
    if (formData.description) completed++;

    return Math.round((completed / total) * 100);
  }, [formData]);

  const progress = calculateProgress();

  // Auto-save draft every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.name) {
        handleSaveDraft();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [formData]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, categoriesData, placesData, amenitiesData] = await Promise.all([
          metaService.getLocations(),
          metaService.getCategories(),
          tourService.getAllPlaces(),
          tourService.getAllAmenities(),
        ]);

        setLocations(locationsData);
        setCategories(categoriesData);
        setAllPlaces(Array.isArray(placesData) ? placesData : placesData?.data || []);
        setAllAmenities(Array.isArray(amenitiesData) ? amenitiesData : amenitiesData?.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // ===================== HANDLERS =====================
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generateSlug = () => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? Number(value) : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      // Simulate saving to localStorage or API
      localStorage.setItem('tour_draft', JSON.stringify(formData));
      setLastSaved(new Date());
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePublish = () => {
    // Trigger the form submit
    const formSubmitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (formSubmitBtn) formSubmitBtn.click();
  };

  // ---- IMAGES ----
  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '', isCover: prev.images.length === 0, order: prev.images.length + 1 }]
    }));
  };

  const updateImage = (index: number, field: keyof TourImage, value: string | boolean | number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], [field]: value };
      if (field === 'isCover' && value === true) {
        newImages.forEach((img, i) => {
          if (i !== index) img.isCover = false;
        });
      }
      return { ...prev, images: newImages };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadService.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, {
          url: imageUrl,
          alt: prev.name || 'Tour image',
          isCover: prev.images.length === 0,
          order: prev.images.length + 1
        }]
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi tải ảnh lên!');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i + 1 }))
    }));
  };

  // ---- ITINERARY ----
  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, {
        dayNumber: prev.itinerary.length + 1,
        title: `Ngày ${prev.itinerary.length + 1}`,
        description: '',
        accommodation: '',
        meals: '',
        places: []
      }]
    }));
  };

  const updateItineraryDay = (dayIndex: number, field: keyof ItineraryDay, value: string | number | DayPlace[]) => {
    setFormData(prev => {
      const newItinerary = [...prev.itinerary];
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const removeItineraryDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== dayIndex).map((day, i) => ({ ...day, dayNumber: i + 1 }))
    }));
  };

  const addPlaceToDay = (dayIndex: number) => {
    setFormData(prev => {
      const newItinerary = [...prev.itinerary];
      newItinerary[dayIndex].places.push({
        placeId: 0,
        visitOrder: newItinerary[dayIndex].places.length + 1,
        durationMinutes: 60,
        notes: ''
      });
      return { ...prev, itinerary: newItinerary };
    });
  };

  const updatePlaceInDay = (dayIndex: number, placeIndex: number, field: keyof DayPlace, value: number | string) => {
    setFormData(prev => {
      const newItinerary = [...prev.itinerary];
      const place = newItinerary[dayIndex].places[placeIndex];
      if (field === 'placeId') {
        const selectedPlace = allPlaces.find(p => p.id === Number(value));
        place.placeId = Number(value);
        place.placeName = selectedPlace?.name || '';
      } else {
        (place as unknown as Record<string, unknown>)[field] = value;
      }
      return { ...prev, itinerary: newItinerary };
    });
  };

  const removePlaceFromDay = (dayIndex: number, placeIndex: number) => {
    setFormData(prev => {
      const newItinerary = [...prev.itinerary];
      newItinerary[dayIndex].places = newItinerary[dayIndex].places
        .filter((_, i) => i !== placeIndex)
        .map((p, i) => ({ ...p, visitOrder: i + 1 }));
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleLocationSelect = async (loc: any) => {
    try {
      const result = await metaService.findOrCreateLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.name,
        address: loc.address,
        placeId: loc.placeId,
        photos: loc.photos
      });

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          locationId: Number(result.data.id),
          latitude: Number(result.data.latitude),
          longitude: Number(result.data.longitude),
          locationName: result.data.name
        }));

        // Refresh locations list if it's a new one
        const updatedLocations = await metaService.getLocations();
        setLocations(updatedLocations);
      } else {
        // Fallback to just saving coordinates if service fails
        setFormData(prev => ({
          ...prev,
          latitude: loc.latitude,
          longitude: loc.longitude,
          locationName: loc.name || loc.address
        }));
      }
    } catch (error) {
      console.error('Error in handleLocationSelect:', error);
      setFormData(prev => ({
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.name || loc.address
      }));
    } finally {
      setShowMapPicker(false);
    }
  };

  const handlePlaceFromMap = async (placeData: PlaceData) => {
    if (editingPlaceInfo === null) return;

    const { dayIndex, placeIndex } = editingPlaceInfo;

    try {
      const result = await metaService.findOrCreatePlace({
        locationId: Number(formData.locationId),
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        name: placeData.name,
        address: placeData.address,
        placeId: placeData.placeId,
        photos: placeData.photos,
        type: (placeData.type as 'ATTRACTION' | 'RESTAURANT' | 'HOTEL' | 'SHOPPING' | 'ENTERTAINMENT' | 'OTHER' | undefined)
      });

      if (!result.success) {
        alert(`Không thể lưu địa điểm: ${result.error || 'Lỗi không xác định'}`);
        return;
      }

      const savedPlace = result.data;
      if (!savedPlace || !savedPlace.id) {
        alert('Lỗi: Server không trả về thông tin địa điểm sau khi lưu.');
        return;
      }

      const savedPlaceId = Number(savedPlace.id);

      setFormData(prev => {
        const newItinerary = [...prev.itinerary];
        const place = newItinerary[dayIndex].places[placeIndex];
        place.placeId = savedPlaceId;
        place.placeName = savedPlace.name;
        return { ...prev, itinerary: newItinerary };
      });

      setAllPlaces(prev => {
        const exists = prev.some(p => p.id === savedPlaceId);
        if (!exists) {
          return [...prev, {
            id: savedPlaceId,
            name: savedPlace.name,
            type: (savedPlace.type as any) || 'ATTRACTION',
            locationName: locations.find(l => l.id === Number(formData.locationId))?.name
          }];
        }
        return prev;
      });

      setShowPlaceMapPicker(false);
      setEditingPlaceInfo(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving place:', error);
      alert(`Lỗi hệ thống khi lưu địa điểm: ${errorMessage}`);
    }
  };

  const openPlaceMapPicker = (dayIndex: number, placeIndex: number) => {
    if (!formData.locationId) {
      alert('Vui lòng chọn địa điểm (Location) trước khi thêm địa điểm tham quan!');
      return;
    }
    setEditingPlaceInfo({ dayIndex, placeIndex });
    setShowPlaceMapPicker(true);
  };

  // ---- AMENITIES ----
  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, { amenityId: 0, price: 0, isIncluded: true, isOptional: false }]
    }));
  };

  const updateAmenity = (index: number, field: keyof TourAmenity, value: number | boolean | string) => {
    setFormData(prev => {
      const newAmenities = [...prev.amenities];
      if (field === 'amenityId') {
        const selectedAmenity = allAmenities.find(a => a.id === Number(value));
        newAmenities[index].amenityId = Number(value);
        newAmenities[index].amenityName = selectedAmenity?.name || '';
      } else {
        (newAmenities[index] as unknown as Record<string, unknown>)[field] = value;
      }
      return { ...prev, amenities: newAmenities };
    });
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  // ---- SCHEDULES ----
  const addSchedule = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + formData.durationDays - 1);

    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        priceOverride: prev.basePrice,
        totalSlots: prev.maxParticipants,
        availableSlots: prev.maxParticipants,
        status: 'OPEN',
        notes: ''
      }]
    }));
  };

  const updateSchedule = (index: number, field: keyof TourSchedule, value: string | number) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      (newSchedules[index] as unknown as Record<string, unknown>)[field] = value;
      if (field === 'startDate') {
        const start = new Date(value as string);
        const end = new Date(start);
        end.setDate(end.getDate() + formData.durationDays - 1);
        newSchedules[index].endDate = end.toISOString().split('T')[0];
      }
      return { ...prev, schedules: newSchedules };
    });
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  // ===================== SUBMIT =====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiData = {
        name: formData.name,
        slug: formData.slug,
        locationId: Number(formData.locationId),
        categoryId: Number(formData.categoryId),
        shortDescription: formData.shortDescription,
        description: formData.description,
        highlights: formData.highlights,
        includedServices: formData.includedServices,
        excludedServices: formData.excludedServices,
        termsConditions: formData.termsConditions,
        cancellationPolicy: formData.cancellationPolicy,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationName: formData.locationName,
        durationDays: formData.durationDays,
        durationNights: formData.durationNights,
        basePrice: formData.basePrice,
        childPrice: formData.childPrice,
        infantPrice: formData.infantPrice,
        maxParticipants: formData.maxParticipants,
        minParticipants: formData.minParticipants,
        difficultyLevel: formData.difficultyLevel,
        transportationType: formData.transportationType,
        departureLocation: formData.departureLocation,
        returnLocation: formData.returnLocation,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isHotDeal: formData.isHotDeal,
        images: formData.images.filter(img => img.url.trim() !== ''),
        itinerary: formData.itinerary.map(day => ({
          ...day,
          places: day.places.filter(p => p.placeId > 0)
        })),
        amenities: formData.amenities.filter(a => a.amenityId > 0),
        schedules: formData.schedules.filter(s => s.startDate && s.endDate),
      };

      console.log('Submitting tour data:', apiData);

      const result = await tourService.createCompleteTour(apiData);
      console.log('Tour created:', result);

      localStorage.removeItem('tour_draft');
      setCreatedTourId(result.id || result.data?.id || 'NEW');
      setIsSuccessOpen(true);
    } catch (error) {
      console.error('Error creating tour:', error);
      alert('Không thể tạo tour. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  // ===================== RENDER =====================
  return (
    <>
      <ProgressBar progress={progress} />

      <form onSubmit={handleSubmit} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="mx-auto max-w-7xl px-6 py-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/tours" className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Tạo Tour Mới
                </h1>
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              <p className="text-gray-600">Hoàn thành {progress}% • {lastSaved ? `Lưu lần cuối: ${lastSaved.toLocaleTimeString('vi-VN')}` : 'Chưa lưu'}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:border-gray-300 hover:shadow-md disabled:opacity-50"
              >
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-2.5 font-medium text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300"
              >
                <Eye className="h-4 w-4" />
                Xem trước
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStats formData={formData} />

          {/* Form Sections */}
          <div className="space-y-6">

            {/* 1. BASIC INFO */}
            <Section
              id="basic"
              icon={<FileText className="h-6 w-6" />}
              title="Thông tin cơ bản"
              subtitle="Tên tour, địa điểm, danh mục"
              isOpen={openSections.basic}
              onToggle={() => toggleSection('basic')}
              isRequired
              isCompleted={!!(formData.name && formData.locationId && formData.categoryId)}
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Tên tour</span>
                    <span className="text-rose-500">*</span>
                    <Tooltip text="Tên tour nên ngắn gọn, hấp dẫn và chứa từ khóa chính">
                      <Info className="h-4 w-4 text-gray-400" />
                    </Tooltip>
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={generateSlug}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="VD: Phú Quốc 4N3Đ - Thiên đường biển đảo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Slug (URL tự động)</label>
                  <div className="relative">
                    <input
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-gray-600 shadow-sm"
                      placeholder="phu-quoc-4n3d"
                    />
                    <Zap className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  >
                    <option value="DRAFT">📝 Bản nháp</option>
                    <option value="ACTIVE">✅ Đang hoạt động</option>
                    <option value="INACTIVE">⏸️ Ngưng hoạt động</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Địa điểm</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      className="block flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    >
                      <option value="">-- Chọn địa điểm --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                    <Tooltip text="Chọn vị trí từ Google Maps">
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
                      >
                        <Map className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="mt-3 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{formData.locationName || 'Vị trí đã chọn'}</p>
                            <p className="text-xs text-green-600">
                              {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, latitude: null, longitude: null, locationName: '', locationId: '' }))}
                          className="rounded-lg p-2 text-green-600 transition hover:bg-green-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Danh mục</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            {/* 2. PRICING */}
            <Section
              id="price"
              icon={<DollarSign className="h-6 w-6" />}
              title="Thông tin giá"
              subtitle="Giá người lớn, trẻ em, em bé"
              isOpen={openSections.price}
              onToggle={() => toggleSection('price')}
              isRequired
              isCompleted={formData.basePrice > 0}
            >
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Giá người lớn</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="basePrice"
                      type="number"
                      min={0}
                      step={10000}
                      value={formData.basePrice}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-16 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="9,500,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">VNĐ</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Giá trẻ em</label>
                  <div className="relative">
                    <input
                      name="childPrice"
                      type="number"
                      min={0}
                      step={10000}
                      value={formData.childPrice}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-16 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="2,500,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">VNĐ</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Giá em bé</label>
                  <div className="relative">
                    <input
                      name="infantPrice"
                      type="number"
                      min={0}
                      step={10000}
                      value={formData.infantPrice}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-16 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="500,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">VNĐ</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* 3. DURATION & CAPACITY */}
            <Section
              id="duration"
              icon={<Clock className="h-6 w-6" />}
              title="Thời lượng & Sức chứa"
              subtitle="Số ngày, số đêm, số người"
              isOpen={openSections.duration}
              onToggle={() => toggleSection('duration')}
              isCompleted={formData.durationDays > 0}
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Số ngày</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    name="durationDays"
                    type="number"
                    min={1}
                    value={formData.durationDays}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Số đêm</label>
                  <input
                    name="durationNights"
                    type="number"
                    min={0}
                    value={formData.durationNights}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Tối đa</label>
                  <input
                    name="maxParticipants"
                    type="number"
                    min={1}
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Tối thiểu</label>
                  <input
                    name="minParticipants"
                    type="number"
                    min={1}
                    value={formData.minParticipants}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Độ khó</label>
                  <select
                    name="difficultyLevel"
                    value={formData.difficultyLevel}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  >
                    <option value="EASY">😊 Dễ</option>
                    <option value="MODERATE">🙂 Trung bình</option>
                    <option value="CHALLENGING">😅 Khó</option>
                    <option value="DIFFICULT">😰 Rất khó</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* 4. DESCRIPTION */}
            <Section
              id="description"
              icon={<FileText className="h-6 w-6" />}
              title="Mô tả chi tiết"
              subtitle="Thông tin, điểm nổi bật, dịch vụ"
              isOpen={openSections.description}
              onToggle={() => toggleSection('description')}
            >
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả ngắn</label>
                  <textarea
                    name="shortDescription"
                    rows={2}
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="Tóm tắt ngắn gọn về tour (1-2 câu)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="Mô tả đầy đủ về tour, hoạt động, trải nghiệm..."
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Điểm nổi bật</label>
                  <textarea
                    name="highlights"
                    rows={3}
                    value={formData.highlights}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="VD: Vịnh Hạ Long, Chùa Đồng, Cáp treo Yên Tử..."
                  />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">✅ Dịch vụ bao gồm</label>
                    <textarea
                      name="includedServices"
                      rows={4}
                      value={formData.includedServices}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="VD: Xe đưa đón, khách sạn 3*, ăn uống, vé tham quan"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">❌ Dịch vụ không bao gồm</label>
                    <textarea
                      name="excludedServices"
                      rows={4}
                      value={formData.excludedServices}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="VD: Chi phí cá nhân, đồ uống ngoài chương trình"
                    />
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">📋 Điều khoản</label>
                    <textarea
                      name="termsConditions"
                      rows={3}
                      value={formData.termsConditions}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="VD: Mang theo CCCD/hộ chiếu khi tham gia"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">🔄 Chính sách hủy</label>
                    <textarea
                      name="cancellationPolicy"
                      rows={3}
                      value={formData.cancellationPolicy}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                      placeholder="VD: Hủy trước 7 ngày hoàn 70%"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* 5. TRANSPORT */}
            <Section
              id="transport"
              icon="🚌"
              title="Vận chuyển"
              subtitle="Phương tiện, điểm đón/trả"
              isOpen={openSections.transport}
              onToggle={() => toggleSection('transport')}
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Loại phương tiện</label>
                  <select
                    name="transportationType"
                    value={formData.transportationType}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                  >
                    <option value="BUS">🚌 Xe bus</option>
                    <option value="CAR">🚗 Ô tô riêng</option>
                    <option value="PLANE">✈️ Máy bay</option>
                    <option value="TRAIN">🚂 Tàu hỏa</option>
                    <option value="BOAT">🚢 Tàu thuyền</option>
                    <option value="MOTORBIKE">🏍️ Xe máy</option>
                    <option value="MIXED">🔀 Kết hợp</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Điểm khởi hành</label>
                  <input
                    name="departureLocation"
                    value={formData.departureLocation}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="VD: Hà Nội"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Điểm kết thúc</label>
                  <input
                    name="returnLocation"
                    value={formData.returnLocation}
                    onChange={handleChange}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 shadow-sm transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 focus:outline-none"
                    placeholder="VD: Hà Nội"
                  />
                </div>
              </div>
            </Section>

            {/* 6. SETTINGS */}
            <Section
              id="settings"
              icon={<Settings className="h-6 w-6" />}
              title="Cài đặt hiển thị"
              subtitle="Tour nổi bật, Hot deal"
              isOpen={openSections.settings}
              onToggle={() => toggleSection('settings')}
            >
              <div className="flex flex-wrap gap-6">
                <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-yellow-50 to-orange-50 px-6 py-4 transition hover:border-yellow-300 hover:shadow-lg">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-gray-900">Tour nổi bật</span>
                  </div>
                </label>
                <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-rose-50 to-red-50 px-6 py-4 transition hover:border-rose-300 hover:shadow-lg">
                  <input
                    type="checkbox"
                    name="isHotDeal"
                    checked={formData.isHotDeal}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <span className="font-semibold text-gray-900">Hot Deal</span>
                  </div>
                </label>
              </div>
            </Section>

            {/* 7. IMAGES */}
            <Section
              id="images"
              icon={<ImageIcon className="h-6 w-6" />}
              title={`Hình ảnh (${formData.images.length})`}
              subtitle="Upload ảnh tour"
              isOpen={openSections.images}
              onToggle={() => toggleSection('images')}
              isCompleted={formData.images.length > 0}
            >
              <div className="space-y-6">
                {/* Upload Zone */}
                <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 p-12 text-center transition hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={48} className="mb-4 animate-spin text-indigo-600" />
                      <p className="text-lg font-semibold text-indigo-600">Đang tải ảnh lên...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                        <Upload size={36} className="text-indigo-600" />
                      </div>
                      <p className="mb-2 text-lg font-semibold text-gray-700">
                        Kéo thả hoặc click để tải ảnh
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG lên đến 5MB</p>
                    </>
                  )}
                </div>

                {/* Image Grid */}
                {formData.images.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm transition hover:shadow-xl">
                        <div className="relative aspect-video overflow-hidden bg-gray-100">
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                          {img.isCover && (
                            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
                              <Star className="h-3 w-3" />
                              ẢNH BÌA
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <input
                            value={img.alt}
                            onChange={(e) => updateImage(index, 'alt', e.target.value)}
                            className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                            placeholder="Mô tả ảnh..."
                          />
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={img.isCover}
                              onChange={(e) => updateImage(index, 'isCover', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Đặt làm ảnh bìa</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addImage}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Thêm URL thủ công
                </button>
              </div>
            </Section>

            {/* 8. ITINERARY */}
            <Section
              id="itinerary"
              icon={<MapPin className="h-6 w-6" />}
              title={`Lịch trình (${formData.itinerary.length} ngày)`}
              subtitle="Chi tiết từng ngày"
              isOpen={openSections.itinerary}
              onToggle={() => toggleSection('itinerary')}
              isCompleted={formData.itinerary.length > 0}
            >
              <div className="space-y-6">
                {formData.itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                    <div className="flex items-center justify-between border-b-2 border-blue-200 bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-4">
                      <h4 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                          {day.dayNumber}
                        </div>
                        Ngày {day.dayNumber}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItineraryDay(dayIndex)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề ngày</label>
                          <input
                            value={day.title}
                            onChange={(e) => updateItineraryDay(dayIndex, 'title', e.target.value)}
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                            placeholder="VD: Khám phá Hà Nội"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-gray-700">Bữa ăn</label>
                          <input
                            value={day.meals}
                            onChange={(e) => updateItineraryDay(dayIndex, 'meals', e.target.value)}
                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                            placeholder="VD: Sáng, Trưa, Tối"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả hoạt động</label>
                        <textarea
                          value={day.description}
                          onChange={(e) => updateItineraryDay(dayIndex, 'description', e.target.value)}
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          rows={3}
                          placeholder="Mô tả các hoạt động trong ngày..."
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Nơi lưu trú</label>
                        <input
                          value={day.accommodation}
                          onChange={(e) => updateItineraryDay(dayIndex, 'accommodation', e.target.value)}
                          className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          placeholder="VD: Khách sạn 3*"
                        />
                      </div>

                      {/* Places */}
                      <div className="rounded-xl border-2 border-blue-200 bg-white p-4">
                        <h5 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Địa điểm tham quan ({day.places.length})
                        </h5>
                        <div className="space-y-3">
                          {day.places.map((place, placeIndex) => (
                            <div key={placeIndex} className="flex gap-3 items-center rounded-xl border-2 border-gray-200 bg-gray-50 p-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                                {place.visitOrder}
                              </div>
                              <select
                                value={place.placeId}
                                onChange={(e) => updatePlaceInDay(dayIndex, placeIndex, 'placeId', Number(e.target.value))}
                                className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                              >
                                <option value={0}>-- Chọn địa điểm --</option>
                                {allPlaces.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.locationName ? `(${p.locationName})` : ''}
                                  </option>
                                ))}
                              </select>
                              <Tooltip text="Chọn từ Google Maps">
                                <button
                                  type="button"
                                  onClick={() => openPlaceMapPicker(dayIndex, placeIndex)}
                                  className="rounded-lg border-2 border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                                >
                                  <Map className="h-5 w-5" />
                                </button>
                              </Tooltip>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={place.durationMinutes}
                                  onChange={(e) => updatePlaceInDay(dayIndex, placeIndex, 'durationMinutes', Number(e.target.value))}
                                  className="w-20 rounded-lg border-2 border-gray-200 px-2 py-2 text-center text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                                  min={0}
                                />
                                <span className="text-xs text-gray-500">phút</span>
                              </div>
                              <input
                                value={place.notes}
                                onChange={(e) => updatePlaceInDay(dayIndex, placeIndex, 'notes', e.target.value)}
                                className="w-40 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                                placeholder="Ghi chú"
                              />
                              <button
                                type="button"
                                onClick={() => removePlaceFromDay(dayIndex, placeIndex)}
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addPlaceToDay(dayIndex)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <Plus className="h-4 w-4" /> Thêm địa điểm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItineraryDay}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 text-base font-semibold text-indigo-700 transition hover:from-indigo-100 hover:to-purple-100"
                >
                  <Plus className="h-5 w-5" /> Thêm ngày mới
                </button>
              </div>
            </Section>

            {/* 9. AMENITIES */}
            <Section
              id="amenities"
              icon="🛎️"
              title={`Tiện nghi (${formData.amenities.length})`}
              subtitle="Dịch vụ, tiện ích đi kèm"
              isOpen={openSections.amenities}
              onToggle={() => toggleSection('amenities')}
            >
              <div className="space-y-4">
                {formData.amenities.map((amenity, index) => (
                  <div key={index} className="flex gap-4 items-center rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                    <select
                      value={amenity.amenityId}
                      onChange={(e) => updateAmenity(index, 'amenityId', Number(e.target.value))}
                      className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                    >
                      <option value={0}>-- Chọn tiện nghi --</option>
                      {allAmenities.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.icon} {a.name} ({a.category})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={amenity.price}
                        onChange={(e) => updateAmenity(index, 'price', Number(e.target.value))}
                        className="w-32 rounded-lg border-2 border-gray-200 px-3 py-3 text-right text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                        min={0}
                        step={10000}
                      />
                      <span className="text-xs font-medium text-gray-500">VNĐ</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-green-200 bg-green-50 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={amenity.isIncluded}
                        onChange={(e) => updateAmenity(index, 'isIncluded', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                      <span className="text-sm font-medium text-green-700">Bao gồm</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-orange-200 bg-orange-50 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={amenity.isOptional}
                        onChange={(e) => updateAmenity(index, 'isOptional', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600"
                      />
                      <span className="text-sm font-medium text-orange-700">Tùy chọn</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAmenity}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Plus className="h-4 w-4" /> Thêm tiện nghi
                </button>
              </div>
            </Section>

            {/* 10. SCHEDULES */}
            <Section
              id="schedules"
              icon={<Calendar className="h-6 w-6" />}
              title={`Lịch khởi hành (${formData.schedules.length})`}
              subtitle="Các ngày khởi hành"
              isOpen={openSections.schedules}
              onToggle={() => toggleSection('schedules')}
            >
              <div className="space-y-4">
                {formData.schedules.map((schedule, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="grid gap-4 p-6 lg:grid-cols-6">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Ngày bắt đầu</label>
                        <input
                          type="date"
                          value={schedule.startDate}
                          onChange={(e) => updateSchedule(index, 'startDate', e.target.value)}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Ngày kết thúc</label>
                        <input
                          type="date"
                          value={schedule.endDate}
                          onChange={(e) => updateSchedule(index, 'endDate', e.target.value)}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Giá riêng</label>
                        <input
                          type="number"
                          value={schedule.priceOverride}
                          onChange={(e) => updateSchedule(index, 'priceOverride', Number(e.target.value))}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          min={0}
                          step={10000}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Tổng chỗ</label>
                        <input
                          type="number"
                          value={schedule.totalSlots}
                          onChange={(e) => updateSchedule(index, 'totalSlots', Number(e.target.value))}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Còn trống</label>
                        <input
                          type="number"
                          value={schedule.availableSlots}
                          onChange={(e) => updateSchedule(index, 'availableSlots', Number(e.target.value))}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Trạng thái</label>
                        <select
                          value={schedule.status}
                          onChange={(e) => updateSchedule(index, 'status', e.target.value)}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                        >
                          <option value="OPEN">✅ Mở</option>
                          <option value="CLOSED">🔒 Đóng</option>
                          <option value="FULL">⚠️ Hết chỗ</option>
                        </select>
                      </div>
                      <div className="lg:col-span-5">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">Ghi chú</label>
                        <input
                          value={schedule.notes}
                          onChange={(e) => updateSchedule(index, 'notes', e.target.value)}
                          className="block w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 focus:outline-none"
                          placeholder="VD: Tour cao điểm mùa xuân"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 p-2.5 text-white transition hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSchedule}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 transition hover:bg-green-100"
                >
                  <Plus className="h-4 w-4" /> Thêm lịch khởi hành
                </button>
              </div>
            </Section>

          </div>

          {/* Submit Footer */}
          <div className="sticky bottom-0 z-30 -mx-6 mt-8 border-t-2 border-gray-200 bg-white/95 px-6 py-6 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <Check className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Hoàn thành {progress}%</p>
                  <p className="text-sm text-gray-500">
                    {formData.images.length} ảnh • {formData.itinerary.length} ngày • {formData.schedules.length} lịch
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/tours"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Tạo Tour Hoàn Chỉnh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Floating Actions */}
      <FloatingActions
        onSaveDraft={handleSaveDraft}
        onPreview={handlePreview}
        onPublish={handlePublish}
        progress={progress}
        isSubmitting={loading}
      />

      {/* Preview Modal */}
      <TourPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        tourData={formData}
        isDraft={true}
      />

      {/* Success Modal */}
      <TourSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => {
          setIsSuccessOpen(false);
          router.push('/tours');
        }}
        tourId={createdTourId}
        tourName={formData.name}
      />

      {/* Main Location Map Picker Modal */}
      <LocationPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={handleLocationSelect}
        initialLocation={formData.latitude && formData.longitude ? {
          latitude: formData.latitude,
          longitude: formData.longitude,
          name: formData.locationName,
          address: ''
        } : null}
        title="Chọn vị trí Tour trên Google Maps"
      />

      {/* Place (Itinerary) Map Picker Modal */}
      <PlacePickerModal
        isOpen={showPlaceMapPicker && editingPlaceInfo !== null}
        onClose={() => {
          setShowPlaceMapPicker(false);
          setEditingPlaceInfo(null);
        }}
        onPlaceSelect={handlePlaceFromMap}
        parentLocation={(() => {
          const loc = locations.find(l => l.id === Number(formData.locationId));
          return loc ? {
            id: Number(loc.id),
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
            name: loc.name
          } : undefined;
        })()}
        initialPlace={(() => {
          if (!editingPlaceInfo) return null;
          const day = formData.itinerary[editingPlaceInfo.dayIndex];
          const place = day.places[editingPlaceInfo.placeIndex];
          const existingPlace = allPlaces.find(p => p.id === place.placeId);
          return existingPlace ? {
            name: existingPlace.name,
            latitude: 0,
            longitude: 0,
            address: '',
            placeId: ''
          } : null;
        })()}
        maxDistanceKm={500}
        title={`Chọn điểm tham quan Ngày ${editingPlaceInfo ? editingPlaceInfo.dayIndex + 1 : ''}`}
      />
    </>
  );
}
