"use client";
import { useEffect, useRef } from "react";

// Define a type for the anime function
// type AnimeFunction = (params: any) => any;

export default function HeroSections() {
  // Component với các phần tử du lịch chuyển động và nội dung tĩnh
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Temporarily disabled anime.js animations
    console.log("Anime.js animations temporarily disabled");
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Animated travel-themed elements - Phân bố đều hơn */}
      <div className="absolute top-14 left-24 text-white opacity-50 text-[10rem] animate-float-1">
        ✈️
      </div>
      <div className="absolute top-4 right-14 text-white opacity-50 text-[10rem] animate-float-2">
        🏝️
      </div>
      <div className="absolute bottom-30 left-14 text-white opacity-50 text-[9rem] animate-float-3">
        🧳
      </div>
      <div className="absolute bottom-28 right-28 text-white opacity-50 text-[9rem] animate-float-5">
        🗺️
      </div>
      <div className="absolute top-4 left-1/3 text-white opacity-30 text-[9rem] animate-float-6">
        🚗
      </div>
      <div className="absolute bottom-48 right-1/3 text-white opacity-30 text-[9rem] animate-float-7">
        🏨
      </div>
      <div className="absolute top-72 left-58 text-white opacity-50 text-[9rem] animate-float-8">
        🌴
      </div>
      <div className="absolute bottom-72 right-52 text-white opacity-50 text-[9rem] animate-float-9">
        🚢
      </div>
      <div className="relative isolate px-6 pt-8 lg:px-8">
        <div className="mx-auto max-w-2xl pt-4 pb-16 sm:pt-8 sm:pb-24 lg:pt-12 lg:pb-32">
          <div className="text-center -mt-4">
            <h1 className="text-4xl font-bold text-white sm:text-7xl">
              <div>Đi du lịch thông minh cùng</div>
              <div className="mt-9 font-['PlaywriteDKLoopet'] text-[#FFD700]">
                Explavue!
              </div>
            </h1>
            <p className="mt-12 text-base font-normal text-gray-100 sm:text-xl leading-relaxed">
              Khám phá điểm đến mới, tạo lộ trình tối ưu và tiết kiệm thời gian
              với hệ thống gợi ý thông minh được hỗ trợ bởi AI. Để mỗi chuyến đi
              của bạn trở nên đặc biệt và trọn vẹn hơn!
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                ref={buttonRef}
                href="/login"
                className="group relative rounded-full bg-[#FFD700] px-5 py-3 text-sm font-semibold text-black shadow-md transition-all duration-300 border-2 border-transparent hover:bg-white hover:border-[#FFD700] hover:pr-9"
              >
                <span className="relative z-10">
                  BẮT ĐẦU HÀNH TRÌNH CỦA BẠN
                </span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 transform opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#FFD700"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
