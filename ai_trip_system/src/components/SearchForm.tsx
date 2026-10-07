"use client";

import { useState } from "react";

const SearchForm = () => {
  const [budget, setBudget] = useState(33);

  return (
    <div className="bg-white rounded-xl p-6 border border-[#dadce0]">
      <h2 className="text-2xl font-semibold text-center text-blue-900 mb-8">
        Tìm kiếm địa điểm
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-city mr-2"></i>
            Thành phố
          </label>
          <div className="relative">
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn thành phố</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-map-marked-alt mr-2"></i>
            Loại hình du lịch
          </label>
          <div className="relative">
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn loại hình</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-bus mr-2"></i>
            Phương tiện di chuyển
          </label>
          <div className="relative">
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn phương tiện</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-users mr-2"></i>
            Số người
          </label>
          <div className="relative">
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Chọn số người</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-calendar mr-2"></i>
            Thời gian
          </label>
          <input
            type="date"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3 space-y-2">
          <label className="flex items-center text-blue-900 font-medium">
            <i className="fas fa-money-bill-wave mr-2"></i>
            Ngân sách (triệu VND)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="w-12 text-center font-medium">{budget}</span>
          </div>
        </div>
      </div>

      <button className="w-full mt-8 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium">
        <i className="fas fa-search mr-2"></i>
        Tìm kiếm
      </button>
    </div>
  );
};

export default SearchForm;
