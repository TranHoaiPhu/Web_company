// components/tour-detail/Itinerary.tsx (Accordion)
'use client';
import { ItineraryDay } from '@/types/itinerary';
import { motion } from 'framer-motion';
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/hooks';

export default function Itinerary({ itinerary }: { itinerary: ItineraryDay[] }) {
  const { t } = useTranslation("tour");
  const [openDay, setOpenDay] = useState(0);

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-4">{t("itinerary.title")}</h2>
      {itinerary.map((day, i) => (
        <div key={i} className="mb-4">
          <button
            onClick={() => setOpenDay(openDay === i ? -1 : i)}
            className="w-full text-left bg-white p-4 rounded-2xl shadow-md flex justify-between"
          >
            <span>{t("itinerary.day")} {day.day_number}: {day.title}</span>
            <span>{openDay === i ? '-' : '+'}</span>
          </button>
          {openDay === i && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-4">
              <p>{day.description}</p>
              {/* Ảnh nhỏ, icon meals/accommodation */}
            </motion.div>
          )}
        </div>
      ))}
    </section>
  );
}