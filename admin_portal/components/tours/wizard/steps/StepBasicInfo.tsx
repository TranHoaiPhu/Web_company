/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Tour, tourService } from '@/services/tour.service';
import { metaService, Location, Category } from '@/services/meta.service';
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface StepProps {
  data: Partial<Tour>;
  onChange: (data: Partial<Tour>) => void;
  onNext: (tourId: string) => void;
}

// ==================== STEP 1: BASIC INFO ====================
const StepBasicInfo = ({ data, onChange, onNext }: StepProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      const [locs, cats] = await Promise.all([
        metaService.getLocations(),
        metaService.getCategories()
      ]);
      setLocations(locs);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load metadata", error);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      let result;
      if (data.id) {
        result = await tourService.updateTour(data.id, data);
      } else {
        result = await tourService.createTour(data);
      }

      if (result.success && result.data.id) {
        onNext(result.data.id);
      }
    } catch (error) {
      console.error("Failed to save tour", error);
      alert("Failed to save tour. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Tour, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Hero Input - Tour Name */}
      <div style={{
        background: "#f0f9ff",
        border: "1px solid #e0f2fe",
      }} className="rounded-xl p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Tour Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Amazing Ha Long Bay Cruise & Island Adventure"
          className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
          value={data.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1 text-blue-600" />
            Location <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 bg-white text-slate-900"
            disabled={loadingMeta}
            value={data.locationId || ''}
            onChange={(e) => updateField('locationId', e.target.value)}
          >
            <option value="">Select location</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 bg-white text-slate-900"
            disabled={loadingMeta}
            value={data.categoryId || ''}
            onChange={(e) => updateField('categoryId', e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Base Price (VND) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₫</span>
            <input
              type="number"
              placeholder="1,000,000"
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
              value={data.basePrice || ''}
              onChange={(e) => updateField('basePrice', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Max Participants */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Users className="inline w-4 h-4 mr-1 text-blue-600" />
            Max Participants
          </label>
          <input
            type="number"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
            value={data.maxParticipants || 10}
            onChange={(e) => updateField('maxParticipants', parseInt(e.target.value))}
          />
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Clock className="inline w-4 h-4 mr-1 text-blue-600" />
            Duration (Days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
            value={data.durationDays || 1}
            onChange={(e) => updateField('durationDays', parseInt(e.target.value))}
          />
        </div>

        {/* Duration Nights */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Nights)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
            value={data.durationNights || 0}
            onChange={(e) => updateField('durationNights', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Short Description</label>
        <textarea
          rows={2}
          placeholder="Brief overview for listings..."
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
          value={data.shortDescription || ''}
          onChange={(e) => updateField('shortDescription', e.target.value)}
        />
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Full Description</label>
        <textarea
          rows={6}
          placeholder="Detailed tour description..."
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400 bg-white text-slate-900"
          value={data.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAndContinue}
          disabled={saving || !data.name || !data.basePrice || !data.locationId}
          className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
