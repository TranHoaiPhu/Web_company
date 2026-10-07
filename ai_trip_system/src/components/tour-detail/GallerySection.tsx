'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ImageOff, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const FALLBACK_IMAGE = '/images/placeholder-tour.jpg';

type ImageType = {
  url: string;
  alt?: string;
  is_cover?: boolean;
};

interface GallerySectionProps {
  images: ImageType[];
  tourName: string;
}

export default function GallerySection({ images, tourName }: GallerySectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [errorImages, setErrorImages] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

  // Filter out invalid images (empty url)
  const validImages = images?.filter(img => img?.url && img.url.trim() !== '') || [];

  const handleImageError = useCallback((idx: number) => {
    setErrorImages((prev) => {
      if (prev.has(idx)) return prev;
      const newSet = new Set(prev);
      newSet.add(idx);
      return newSet;
    });
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
  }, []);

  const handleImageLoad = useCallback((idx: number) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextLightbox, prevLightbox]);

  // Auto-play (optional)
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000); // 5s auto slide
    return () => clearInterval(interval);
  }, [nextSlide]);

  const getVisibleThumbnails = () => {
    const thumbnailCount = 5;
    const start = Math.max(0, currentSlide - Math.floor(thumbnailCount / 2));
    const end = Math.min(validImages.length, start + thumbnailCount);
    return validImages.slice(start, end).map((img, i) => ({ img, index: start + i }));
  };

  // If no valid images, show placeholder (after hooks)
  if (validImages.length === 0) {
    return (
      <section className="space-y-4">
        <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <ImageOff className="w-16 h-16" strokeWidth={1.5} />
            <span className="text-sm font-medium">Chưa có hình ảnh</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Main Slider */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {errorImages.has(currentSlide) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <ImageOff className="w-16 h-16" strokeWidth={1.5} />
                <span className="text-sm font-medium">Ảnh không khả dụng</span>
              </div>
            ) : (
              <>
                {loadingImages.has(currentSlide) && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]" 
                       style={{ animation: 'shimmer 1.5s infinite' }} />
                )}
                <Image
                  src={validImages[currentSlide]?.url || FALLBACK_IMAGE}
                  alt={validImages[currentSlide]?.alt || tourName}
                  fill
                  className={`object-contain transition-opacity duration-500 ${
                    loadingImages.has(currentSlide) ? 'opacity-0' : 'opacity-100'
                  }`}
                  sizes="100vw"
                  priority={currentSlide === 0}
                  onError={() => handleImageError(currentSlide)}
                  onLoad={() => handleImageLoad(currentSlide)}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={() => openLightbox(currentSlide)}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
          aria-label="Xem toàn màn hình"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Cover Badge */}
        {validImages[currentSlide]?.is_cover && (
          <span className="absolute top-4 left-4 text-xs bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
            Ảnh bìa
          </span>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-sm text-sm font-medium">
          {currentSlide + 1} / {validImages.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {getVisibleThumbnails().map(({ img, index }) => {
          const hasError = errorImages.has(index);
          const isActive = index === currentSlide;

          return (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ml-2.5 ${
                isActive
                  ? 'ring-2 ring-blue-500 scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {hasError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <ImageOff className="w-6 h-6 text-gray-400" />
                </div>
              ) : (
                <Image
                  src={img.url}
                  alt={img.alt || tourName}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => handleImageError(index)}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-10"
              aria-label="Đóng"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Navigation in Lightbox */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevLightbox();
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition z-10"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextLightbox();
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition z-10"
                  aria-label="Ảnh tiếp"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium z-10">
              {lightboxIndex + 1} / {validImages.length}
            </div>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={validImages[lightboxIndex]?.url || FALLBACK_IMAGE}
                alt={validImages[lightboxIndex]?.alt || tourName}
                fill
                className="object-contain "
                sizes="100vw"
                priority
              />
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}