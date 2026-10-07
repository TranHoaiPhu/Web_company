"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Feature() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      id="features"
      className="py-24 sm:py-24 bg-transparent"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Trải nghiệm với{" "}
            <span className="text-[#FFD700] font-['PlaywriteDKLoopet']">
              Explavue!
            </span>
          </h2>
        </div>

        {/* Main Content Grid */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-8 items-start transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Left Column*/}
          <div className="bg-white rounded-2xl shadow-lg p-4 border-[0.5px] border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/destinations/sapa.jpg"
                alt="Sapa"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                width={500}
                height={500}
              />
            </div>
          </div>

          {/* Center Column */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border-[0.5px] border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/destinations/halong.jpg"
                alt="Hạ Long"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                width={500}
                height={500}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border-[0.5px] border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src="/destinations/hoian.jpg"
                alt="Hội An"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>

        {/* Feature Descriptions */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 transition-all duration-1000 delay-600 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Lên lịch trình đúng ý
            </h3>
            <p className="text-gray-200">theo sở thích của riêng bạn</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Tích hợp bản đồ
            </h3>
            <p className="text-gray-200">gợi ý đường đi ngắn nhất</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Nhận ngay Combo ưu đãi đến 40%
            </h3>
            <p className="text-gray-200">
              khi mua hoạt động vui chơi trên lịch trình
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div
          className={`text-center mt-9 transition-all duration-1000 delay-900 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <button
            onClick={() => router.push("/login")}
            className="bg-[#FFD700] hover:bg-[#FFC107] text-black font-semibold px-8 py-4 rounded-full transition-colors duration-200 shadow-lg cursor-pointer"
          >
            ✨ Tạo lịch trình ngay !
          </button>
        </div>
      </div>
    </div>
  );
}
