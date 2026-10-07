// components/tour-detail/DescriptionSection.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks';
import { renderMarkdown } from '@/utils/markdown';

interface DescriptionSectionProps {
  description: string;
  highlights?: string[];
}

export default function DescriptionSection({
  description,
  highlights = [],
}: DescriptionSectionProps) {
  const { t } = useTranslation("tour");

  return (
    <section className="space-y-12 md:space-y-16">
      {/* ── Main Description ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative"
      >
        {/* Subtle decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-cyan-50/40 to-transparent rounded-3xl -z-10" />

        <div className="max-w-none">
          <div
            className="
              bg-white/70 backdrop-blur-sm border border-white/60 
              rounded-3xl p-7 md:p-10 shadow-xl shadow-blue-100/40
              leading-relaxed text-justify
            "
            dangerouslySetInnerHTML={{ __html: renderMarkdown(description || '') }}
          />
        </div>
      </motion.div>

      {/* ── Highlights Block ──────────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative"
        >
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/40 via-cyan-100/40 to-blue-100/40 rounded-[2.5rem] blur-3xl opacity-60 -z-10" />

          <div
            className="
              relative bg-gradient-to-br from-blue-50/80 via-cyan-50/70 to-white/60 
              backdrop-blur-md border border-white/50
              rounded-3xl p-8 md:p-10 shadow-lg shadow-cyan-100/30
            "
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-400/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                {t("description.highlightsTitle")}
              </h3>
            </div>

            {/* Grid of highlight cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {highlights.map((highlight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 + 0.2 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="
                    group flex items-start gap-4 
                    bg-white/70 backdrop-blur-sm border border-cyan-100/60 
                    rounded-2xl p-5 md:p-6 
                    hover:border-cyan-300/60 hover:shadow-xl hover:shadow-cyan-100/40
                    transition-all duration-300
                  "
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 p-1.5 shadow-md shadow-cyan-400/30">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <p className="text-gray-800 leading-relaxed group-hover:text-gray-900 transition-colors">
                    {highlight}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}