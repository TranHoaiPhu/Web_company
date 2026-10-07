"use client";

import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface Destination {
  id: string;
  name: string;
  image: string;
  description: string;
}

const destinations: Destination[] = [
  {
    id: "halong",
    name: "Vịnh Hạ Long",
    image: "/destinations/halong.jpg",
    description: "Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi kỳ thú",
  },
  {
    id: "hoian",
    name: "Hội An",
    image: "/destinations/hoian.jpg",
    description: "Phố cổ lãng mạn với kiến trúc độc đáo và ẩm thực phong phú",
  },
  {
    id: "sapa",
    name: "Sa Pa",
    image: "/destinations/sapa.jpg",
    description: "Thị trấn miền núi với ruộng bậc thang và văn hóa dân tộc",
  },
];

export default function DestinationCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, destinations.length - 1);

  // Reset currentIndex if it's out of bounds
  useEffect(() => {
    if (currentIndex >= destinations.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === destinations.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Safety check to ensure we have destinations
  if (!destinations || destinations.length === 0) {
    return (
      <div className="relative h-[24rem] lg:h-[32rem] w-full bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No destinations available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(
      currentIndex === 0 ? destinations.length - 1 : currentIndex - 1
    );
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(
      currentIndex === destinations.length - 1 ? 0 : currentIndex + 1
    );
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  return (
    <div className="relative h-[24rem] lg:h-[32rem] w-full lg:w-[120%] overflow-hidden rounded-[25px] shadow-lg">
      {/* Main Image */}
      <div className="relative h-full">
        <Image
          src={destinations[safeCurrentIndex].image}
          alt={destinations[safeCurrentIndex].name}
          className="h-full w-full object-cover transition-opacity duration-500"
          width={500}
          height={500}
        />

        {/* Overlay with destination info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-xl font-bold mb-1">
              {destinations[safeCurrentIndex].name}
            </h3>
            <p className="text-sm opacity-90 max-w-xs">
              {destinations[safeCurrentIndex].description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
        aria-label="Previous destination"
      >
        <ChevronLeftIcon className="h-5 w-5 text-white" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
        aria-label="Next destination"
      >
        <ChevronRightIcon className="h-5 w-5 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        {destinations.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === safeCurrentIndex
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
