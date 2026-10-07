"use client";

import { useEffect, useState } from "react";


const sections = [
    { id: "description", label: "Mô tả" },
    { id: "itinerary", label: "Lịch trình" },
    { id: "amenities", label: "Tiện ích" },
    { id: "schedule", label: "Lịch khởi hành" },
    { id: "reviews", label: "Đánh giá" },
];

export default function TourNavigation() {
    const [activeSection, setActiveSection] = useState("");
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Check if we should be sticky (past the hero ~500px)
            const heroHeight = 500;
            setIsSticky(window.scrollY > heroHeight);

            // Determine active section
            const scrollPosition = window.scrollY + 100; // Offset for header

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(section.id);
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!isSticky) return null;

    return (
        <div className="fixed top-20 left-0 right-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300 animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => {
                                const element = document.getElementById(section.id);
                                if (element) {
                                    const offset = 100; // Height of sticky header + nav
                                    const bodyRect = document.body.getBoundingClientRect().top;
                                    const elementRect = element.getBoundingClientRect().top;
                                    const elementPosition = elementRect - bodyRect;
                                    const offsetPosition = elementPosition - offset;

                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: "smooth",
                                    });
                                }
                            }}
                            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-300 outline-none ${activeSection === section.id
                                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>
            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
