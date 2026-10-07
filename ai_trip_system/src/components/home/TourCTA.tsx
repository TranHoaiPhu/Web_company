'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Calendar, Users, Star, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks';
import statisticsService from '@/services/system/statistics.service';

interface Stats {
  destinations: string;
  customers: string;
  rating: string;
  daysInYear: string;
  bookedThisWeek: string;
}

export default function TourCTA() {
  const { t } = useTranslation('home');
  const [isHovered, setIsHovered] = useState(false);
  const [stats, setStats] = useState<Stats>({
    destinations: '200+',
    customers: '50K+',
    rating: '4.9/5',
    daysInYear: '365',
    bookedThisWeek: '15,000+'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch overall stats
        const publicStats = await statisticsService.getPublicStats();

        // Fetch weekly stats
        const today = new Date().toISOString().split('T')[0];
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weeklyOverview = await statisticsService.getDashboardOverview(); // Default is last 30 days but we can refine if needed

        if (publicStats) {
          setStats(prev => ({
            ...prev,
            destinations: (publicStats.totalTours || 200) + '+',
            customers: publicStats.totalCustomers > 1000
              ? (publicStats.totalCustomers / 1000).toFixed(1) + 'K+'
              : publicStats.totalCustomers + '+',
          }));
        }

        // Try to get a more accurate weekly count if possible from overview
        const overview = await statisticsService.getDashboardOverview();
        if (overview && overview.summary) {
          setStats(prev => ({
            ...prev,
            bookedThisWeek: (overview.summary.totalOrders || 15000).toLocaleString('vi-VN') + '+'
          }));
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="py-20 flex items-center justify-center p-4">
      <div className="max-w-8xl w-full">
        {/* Main CTA Card */}
        <div className="relative group">
          {/* Animated Background Glow */}
          <div className="absolute -inset-1  rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-500 animate-pulse"></div>

          {/* Main Card */}
          <div className="relative bg-white dark:bg-slate-900 backdrop-blur-2xl rounded-[40px] overflow-hidden border border-white/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
              {/* Left Content */}
              <div className="space-y-6 z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-full px-4 py-2 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{t('tourCTA.badge')}</span>
                </div>

                {/* Heading */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                    {t('tourCTA.title')}
                    <span className="block mt-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-transparent bg-clip-text animate-gradient-x px-1">
                      {t('tourCTA.titleHighlight')}
                    </span>
                    {t('tourCTA.titleEnd')}
                  </h1>
                  <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 font-medium leading-relaxed max-w-lg">
                    {t('tourCTA.subtitle')}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 bg-blue-50/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-blue-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-500 group/item">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg shadow-blue-500/20 group-hover/item:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-2xl text-blue-600 dark:text-blue-400">{stats.destinations}</div>
                      <div className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('tourCTA.stats.destinations')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-cyan-50/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-cyan-100 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all duration-500 group/item">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-3 shadow-lg shadow-cyan-500/20 group-hover/item:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-2xl text-cyan-600 dark:text-cyan-400">{stats.customers}</div>
                      <div className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('tourCTA.stats.customers')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-blue-50/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-blue-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-500 group/item">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-3 shadow-lg shadow-blue-600/20 group-hover/item:scale-110 transition-transform">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-2xl text-blue-700 dark:text-blue-300">{stats.rating}</div>
                      <div className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('tourCTA.stats.rating')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-cyan-50/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-cyan-100 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all duration-500 group/item">
                    <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-3 shadow-lg shadow-cyan-600/20 group-hover/item:scale-110 transition-transform">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-black text-2xl text-cyan-700 dark:text-cyan-300">{stats.daysInYear}</div>
                      <div className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('tourCTA.stats.daysPerYear')}</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="group relative bg-blue-600 text-white font-black px-10 py-5 rounded-2xl overflow-hidden shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-500 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 group-hover:scale-110 transition-transform duration-500"></div>
                    <span className="relative flex items-center gap-2 text-lg">
                      {t('tourCTA.buttons.bookNow')}
                      <ArrowRight className={`w-6 h-6 transition-transform duration-500 ${isHovered ? 'translate-x-1' : ''}`} />
                    </span>
                  </button>

                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-10 py-5 rounded-2xl border-2 border-transparent hover:bg-transparent hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white transition-all duration-500 hover:scale-[1.02] active:scale-95 text-lg">
                    {t('tourCTA.buttons.viewMore')}
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 pt-8 border-t border-slate-200 dark:border-white/10">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black shadow-xl ring-2 ring-blue-500/20">
                        {i}K
                      </div>
                    ))}
                  </div>
                  <div className="text-md text-slate-500 dark:text-gray-400">
                    <span className="font-black text-slate-900 dark:text-white text-xl">{stats.bookedThisWeek}</span> {t('tourCTA.trust.bookedThisWeek')}
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative z-10 hidden md:block">
                <div className="relative h-full min-h-[500px] rounded-[40px] overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20">
                  {/* Image Placeholder with Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-cyan-400/30 to-blue-500/30 backdrop-blur-sm"></div>

                  {/* Animated Circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-80 h-80">
                      <div className="absolute inset-0 border-4 border-blue-400/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-8 border-4 border-cyan-400/30 rounded-full animate-pulse"></div>
                      <div className="absolute inset-16 border-4 border-blue-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>

                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-8 shadow-2xl">
                          <MapPin className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-10 right-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/30 shadow-2xl animate-float">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500 rounded-2xl p-3 shadow-lg shadow-blue-500/30">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-md font-black text-slate-900 dark:text-white">{t('tourCTA.floatingCards.discount')}</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-widest">{t('tourCTA.floatingCards.summerTour')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-10 left-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl p-5 border border-white/30 shadow-2xl animate-float" style={{ animationDelay: '1.5s' }}>
                    <div className="flex items-center gap-4">
                      <div className="bg-cyan-500 rounded-2xl p-3 shadow-lg shadow-cyan-500/30">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-md font-black text-slate-900 dark:text-white">{t('tourCTA.floatingCards.bookNow')}</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-widest">{t('tourCTA.floatingCards.freeCancellation')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}