"use client";
import { AiOutlineExpandAlt } from "react-icons/ai";
import dynamic from "next/dynamic";
import { FaClock, FaMapMarkerAlt, FaTag, FaLightbulb } from "react-icons/fa";

const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function DetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-cyan-500 mb-10 text-center">
          🗓️ Lịch trình du lịch
        </h1>

        <div className="flex flex-col gap-8">
          {/* Ngày 1 */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
            <p className="text-2xl font-bold text-red-600 px-6 py-4 hover:bg-gray-100 cursor-pointer transition">
              📍 Ngày 1 (13/4/2025)
            </p>

            <div
              className="relative h-[400px] bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/hinh-nen-may-tinh.jpg')",
              }}
            >
              {/* Map Overlay */}
              <div className="absolute top-4 right-4 z-10 w-[200px] h-[150px] rounded-lg overflow-hidden shadow-lg border-2 border-white">
                <MapView />
              </div>

              {/* Expand Icon */}
              <AiOutlineExpandAlt className="absolute bottom-4 right-4 w-8 h-8 text-white bg-black/40 rounded-full p-1 cursor-pointer hover:bg-black/60 transition" />

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-black/40 flex items-end">
                <div className="text-white p-6 w-full">
                  <div className="flex items-center mb-4">
                    <input
                      id="visit-checkbox"
                      type="checkbox"
                      className="w-5 h-5 accent-cyan-500"
                    />
                    <label
                      htmlFor="visit-checkbox"
                      className="ml-3 text-xl font-semibold"
                    >
                      Tham quan địa điểm nổi bật
                    </label>
                  </div>

                  <ul className="space-y-2 text-sm md:text-base font-medium">
                    <li className="flex items-center gap-2">
                      <FaClock /> <span>Thời gian: 08:00 - 10:00</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaMapMarkerAlt />{" "}
                      <span>Địa chỉ: 123 Đường ABC, Quận 1</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaTag /> <span>Kiểu: Văn hóa</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaLightbulb /> <span>Gợi ý: Mang theo máy ảnh!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Ngày 2 */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <p className="text-2xl font-bold text-slate-800 hover:text-blue-500 cursor-pointer">
              📍 Ngày 2 (14/4/2025)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
