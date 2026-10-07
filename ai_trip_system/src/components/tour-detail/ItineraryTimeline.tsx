'use client';

import { ItineraryDay, DayPlace } from '@/types/itinerary';
import { motion } from 'framer-motion';
import { MapPin, Clock, Utensils, Hotel } from 'lucide-react';
import Image from 'next/image';
import { renderMarkdown } from '@/utils/markdown';

const dayVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0 },
};

const placeVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function ItineraryTimeline({
  itinerary,
}: {
  itinerary: ItineraryDay[];
}) {
  return (
    <section className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-12">
        {itinerary.map((day) => (
          <motion.div
            key={day.day_number}
            variants={dayVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative pl-12 md:pl-16"
          >
            {/* Day marker */}
            <div className="absolute left-0 top-6 w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
              {day.day_number}
            </div>

            {/* Day card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {day.title}
                </h3>
                <div
                  className="mt-2 text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(day.description || '') }}
                />
              </div>

              {/* Info */}
              {(day.accommodation || day.meals) && (
                <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {day.accommodation && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Hotel className="w-4 h-4 text-gray-500" />
                      <span>{day.accommodation}</span>
                    </div>
                  )}

                  {day.meals && (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Utensils className="w-4 h-4 text-gray-500" />
                      <span>{day.meals}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Places */}
              {day.places && day.places.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Places visited
                  </div>

                  <div className="space-y-3">
                    {day.places.map((p: DayPlace, i: number) => (
                      <motion.div
                        key={p.place.id}
                        variants={placeVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition"
                      >
                        {/* Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={p.place.image_url}
                            alt={p.place.name}
                            fill
                            sizes="64px"
                            className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {p.place.name}
                          </h4>

                          {p.duration_minutes && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {Math.floor(p.duration_minutes / 60)}h
                                {p.duration_minutes % 60 > 0 &&
                                  ` ${p.duration_minutes % 60}m`}
                              </span>
                            </div>
                          )}

                          {p.place.address && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {p.place.address}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
