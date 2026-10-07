"use client";

import { useEffect, useRef, useState } from "react";
import DestinationCarousel from "@/components/ui/DestinationCarousel";

const features = [
  {
    name: "Lập kế hoạch với AI.",
    description:
      "Dựa trên sở thích và nhu cầu của bạn, AI sẽ tạo ra một lịch trình du lịch hoàn hảo.",
  },
  {
    name: "Du lịch cùng bạn bè.",
    description:
      "Hỗ trợ kết nối bạn bè và gia đình để cùng nhau lên kế hoạch cho chuyến đi.",
  },
  {
    name: "Sự hỗ trợ 24/7.",
    description:
      "Chúng tôi cung cấp hỗ trợ khách hàng 24/7 để đảm bảo bạn có trải nghiệm tốt nhất.",
  },
];

export default function Abouts() {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([false, false, false]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Animate features one by one with delay
          features.forEach((_, index) => {
            setTimeout(() => {
              setVisibleFeatures(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, 500 + index * 300); // Start after title animation, then 300ms between each
          });
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);
  return (
    <div id="about" className="overflow-hidden bg-transparent py-24 sm:py-32" ref={sectionRef}>
      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-6">
          <div className="lg:col-span-3 lg:pr-4 lg:-ml-8">
            <div className="lg:max-w-xl">
              {/* Title with fade-in animation */}
              <div className={`transition-all duration-1000 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <p className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                  Du lịch nhanh hơn với
                </p>
                <p className="mt-2 text-4xl font-semibold sm:text-5xl">
                  <span className="text-[#FFD700] font-['PlaywriteDKLoopet'] font-bold">Explavue!</span>
                </p>
              </div>

              <p className={`mt-6 text-lg/8 text-gray-100 transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                Explavue giúp bạn tiết kiệm thời gian và công sức trong việc lên
                kế hoạch cho chuyến đi. Với nền tảng của chúng tôi, bạn có thể
                dễ dàng tìm kiếm, so sánh và đặt các dịch vụ du lịch chỉ trong
                vài phút.
              </p>
              {/* Timeline container */}
              <div className="mt-10 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 w-0.5 bg-gray-600 h-full">
                  <div
                    className="w-full bg-gradient-to-b from-[#FFD700] to-[#FFA500] transition-all duration-2000 ease-out"
                    style={{
                      height: visibleFeatures.filter(Boolean).length > 0
                        ? `${(visibleFeatures.filter(Boolean).length / features.length) * 100}%`
                        : '0%'
                    }}
                  />
                </div>

                <dl className="space-y-8 text-base/7 text-gray-100">
                  {features.map((feature, index) => (
                    <div
                      key={feature.name}
                      className={`relative pl-12 transition-all duration-700 ease-out ${
                        visibleFeatures[index]
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 translate-x-8'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                        visibleFeatures[index]
                          ? 'bg-[#FFD700] border-[#FFD700] scale-100'
                          : 'bg-gray-600 border-gray-600 scale-75'
                      }`}>
                        {visibleFeatures[index] && (
                          <div className="absolute inset-1 bg-white rounded-full animate-pulse" />
                        )}
                      </div>

                      <dt className="inline font-semibold text-[#FFD700]">
                        {feature.name}
                      </dt>{" "}
                      <dd className="inline text-gray-100">
                        {feature.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
          {/* Carousel with fade-in animation */}
          <div className={`lg:col-span-3 relative mt-16 lg:mt-0 lg:mr-10 transition-all duration-1000 delay-800 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <DestinationCarousel />
          </div>
        </div>
      </div>
    </div>
  );
}
