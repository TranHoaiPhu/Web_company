'use client';

import { Amenity } from "@/types/amenities";
import { motion } from 'framer-motion';
import { 
  Wifi, 
  UtensilsCrossed, 
  Bus, 
  Camera, 
  Bed, 
  Shield, 
  Heart,
  Sparkles,
  Check,
  Plus,
  Coffee,
  Umbrella,
  MapPin
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks';

// Icon mapping helper
const getIconForAmenity = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('wifi') || lowerName.includes('internet')) return Wifi;
  if (lowerName.includes('ăn') || lowerName.includes('food')) return UtensilsCrossed;
  if (lowerName.includes('xe') || lowerName.includes('bus') || lowerName.includes('transport')) return Bus;
  if (lowerName.includes('camera') || lowerName.includes('photo')) return Camera;
  if (lowerName.includes('nghỉ') || lowerName.includes('hotel') || lowerName.includes('khách sạn')) return Bed;
  if (lowerName.includes('bảo hiểm') || lowerName.includes('insurance')) return Shield;
  if (lowerName.includes('spa') || lowerName.includes('massage')) return Heart;
  if (lowerName.includes('cà phê') || lowerName.includes('coffee')) return Coffee;
  if (lowerName.includes('dù') || lowerName.includes('umbrella')) return Umbrella;
  if (lowerName.includes('hướng dẫn') || lowerName.includes('guide')) return MapPin;
  return Sparkles;
};

export default function AmenitiesGrid({ amenities }: { amenities: Amenity[] }) {
  const { t } = useTranslation("tour");
  
  // Category names mapping using translations
  const categoryNames: Record<string, string> = {
    'transport': t("amenities.categories.transport"),
    'accommodation': t("amenities.categories.accommodation"),
    'food': t("amenities.categories.food"),
    'activity': t("amenities.categories.activity"),
    'service': t("amenities.categories.service"),
    'other': t("amenities.categories.other")
  };
  
  const grouped = amenities.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Amenity[]>);

  return (
    <section className="space-y-12">
      {Object.entries(grouped).map(([category, items], catIdx) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: catIdx * 0.1 }}
        >
          {/* Category Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {categoryNames[category] || category}
            </h3>
            <div className="h-px bg-gray-200" />
          </div>

          {/* Amenities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: Amenity, idx: number) => {
              const Icon = getIconForAmenity(item.name);
              const isIncluded = item.is_included;
              
              return (
                <motion.div
                  key={item.amenity_id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className={`group p-4 rounded-lg border transition-all duration-200 ${
                    isIncluded
                      ? 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      : 'bg-amber-50/30 border-amber-200 hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isIncluded
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {Icon && <Icon className="w-5 h-5" strokeWidth={2} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.name}
                        </h4>
                        
                        {/* Status */}
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          isIncluded
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          {isIncluded ? (
                            <Check className="w-3 h-3" strokeWidth={3} />
                          ) : (
                            <Plus className="w-3 h-3" strokeWidth={3} />
                          )}
                        </div>
                      </div>

                      {/* Trạng thái */}
                      <p className={`text-xs mt-1 font-medium ${
                        isIncluded ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {isIncluded ? t("amenities.included") : t("amenities.surcharge")}
                      </p>

                      {/* Giá phụ thu */}
                      {!isIncluded && item.price > 0 && (
                        <p className="text-sm font-semibold text-amber-700 mt-1">
                          +{item.price.toLocaleString('vi-VN')}₫
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </section>
  );
}