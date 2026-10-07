"use client"

import { useState, useEffect } from 'react';
import { Tour, tourService } from '@/services/tour.service';
import { metaService, Location, Category } from '@/services/meta.service';
import { Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TourFormProps {
  initialData?: Partial<Tour>;
  isEdit?: boolean;
}

export default function TourForm({ initialData, isEdit = false }: TourFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<Partial<Tour>>({
    name: '',
    slug: '',
    status: 'DRAFT',
    basePrice: 0,
    childPrice: 0,
    infantPrice: 0,
    maxParticipants: 10,
    minParticipants: 1,
    durationDays: 1,
    durationNights: 0,
    difficultyLevel: 'EASY',
    transportationType: 'Bus',
    isFeatured: false,
    isHotDeal: false,
    shortDescription: '',
    description: '',
    highlights: '',
    includedServices: '',
    excludedServices: '',
    cancellationPolicy: '',
    termsConditions: '',
    locationId: '',
    categoryId: '',
    departureLocation: '',
    returnLocation: '',
    ...initialData,
  });

  useEffect(() => {
    // Load locations & categories from Database API
    const loadData = async () => {
      try {
        console.log('Loading locations and categories...');
        const [locationsData, categoriesData] = await Promise.all([
          metaService.getLocations(),
          metaService.getCategories(),
        ]);
        console.log('Locations loaded:', locationsData);
        console.log('Categories loaded:', categoriesData);
        setLocations(locationsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading locations and categories:', error);
      }
    };

    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && initialData?.id) {
        await tourService.updateTour(initialData.id, formData);
        alert('Cập nhật tour thành công!');
      } else {
        await tourService.createTour(formData);
        alert('Tạo tour thành công!');
      }
      router.push('/tours');
    } catch (error) {
      console.error('Lỗi khi lưu tour:', error);
      alert('Không thể lưu tour. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen via-white to-gray-50/70 py-10 px-5 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-6xl space-y-10">

        {/* CARD CONTAINER */}
        <div className="space-y-8">

          {/* ================== 1. Thông tin cơ bản ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">📋</span> Thông tin cơ bản
              </h2>
            </div>

            <div className="grid gap-6 p-7 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tên tour <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="name"
                  value={formData.name ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="Ví dụ: Phú Quốc 4N3Đ - Biển xanh cát trắng"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status ?? 'DRAFT'}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngưng hoạt động</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  name="slug"
                  value={formData.slug ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-gray-600 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="phu-quoc-4n3d-bien-xanh-cat-trang"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mã địa điểm <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  name="locationId"
                  value={formData.locationId ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                >
                  <option value="">-- Chọn địa điểm --</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Danh mục</label>
                <select
                  name="categoryId"
                  value={formData.categoryId ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ================== 2. Giá ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">₫</span> Giá
              </h2>
            </div>
            <div className="grid gap-6 p-7 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Giá người lớn <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="basePrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={formData.basePrice ?? 0}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="2,800,000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Giá trẻ em</label>
                <input
                  name="childPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={formData.childPrice ?? 0}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="1,800,000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Giá em bé</label>
                <input
                  name="infantPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={formData.infantPrice ?? 0}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ================== 3. Thời lượng & Số lượng ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">⏳</span> Thời lượng & Số lượng
              </h2>
            </div>
            <div className="grid gap-6 p-7 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Số ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="durationDays"
                  type="number"
                  min={1}
                  value={formData.durationDays ?? 1}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Số đêm</label>
                <input
                  name="durationNights"
                  type="number"
                  min={0}
                  value={formData.durationNights ?? 0}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Số người tối đa <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="maxParticipants"
                  type="number"
                  min={1}
                  value={formData.maxParticipants ?? 10}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Số người tối thiểu</label>
                <input
                  name="minParticipants"
                  type="number"
                  min={1}
                  value={formData.minParticipants ?? 1}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* ================== 4. Mô tả ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">📝</span> Mô tả chi tiết
              </h2>
            </div>
            <div className="space-y-7 p-7">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả ngắn gọn</label>
                <textarea
                  name="shortDescription"
                  rows={3}
                  value={formData.shortDescription ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="Tour 4 ngày 3 đêm khám phá Phú Quốc với biển xanh, cát trắng và hải sản tươi ngon..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                <textarea
                  name="description"
                  rows={8}
                  value={formData.description ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="Chi tiết lịch trình từng ngày, các hoạt động chính, điểm nhấn đặc biệt..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Điểm nổi bật</label>
                <textarea
                  name="highlights"
                  rows={5}
                  value={formData.highlights ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="• Bãi Sao đẹp nhất Phú Quốc\n• Tham quan Nhà thùng nước mắm\n• Ngắm hoàng hôn tại Sunset Beach\n• Ăn tối trên du thuyền..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Dịch vụ bao gồm</label>
                <textarea
                  name="includedServices"
                  rows={4}
                  value={formData.includedServices ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="• Vé máy bay khứ hồi\n• Khách sạn 4 sao\n• Xe đưa đón\n• Bữa ăn theo chương trình\n• Hướng dẫn viên..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Dịch vụ không bao gồm</label>
                <textarea
                  name="excludedServices"
                  rows={4}
                  value={formData.excludedServices ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="• Chi phí cá nhân\n• Visa (nếu có)\n• Đồ uống ngoài chương trình\n• Tiền tip..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Chính sách hủy</label>
                <textarea
                  name="cancellationPolicy"
                  rows={4}
                  value={formData.cancellationPolicy ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="• Hủy trước 30 ngày: hoàn 100%\n• Hủy trước 15-30 ngày: hoàn 50%\n• Hủy dưới 15 ngày: không hoàn tiền..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Điều khoản & Điều kiện</label>
                <textarea
                  name="termsConditions"
                  rows={4}
                  value={formData.termsConditions ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="Các điều khoản chung về đặt tour, trách nhiệm các bên..."
                />
              </div>
            </div>
          </div>

          {/* ================== 5. Độ khó & Vận chuyển ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">🧗</span> Độ khó & Vận chuyển
              </h2>
            </div>
            <div className="grid gap-6 p-7 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Độ khó</label>
                <select
                  name="difficultyLevel"
                  value={formData.difficultyLevel ?? 'EASY'}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MODERATE">Trung bình</option>
                  <option value="CHALLENGING">Khó</option>
                  <option value="DIFFICULT">Rất khó</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Loại vận chuyển</label>
                <input
                  name="transportationType"
                  value={formData.transportationType ?? 'Bus'}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="Bus, Speedboat, Máy bay, Xe máy..."
                />
              </div>
            </div>
          </div>

          {/* ================== 6. Địa điểm khởi hành / kết thúc ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">📍</span> Địa điểm
              </h2>
            </div>
            <div className="grid gap-6 p-7 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Điểm khởi hành</label>
                <input
                  name="departureLocation"
                  value={formData.departureLocation ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="TP. Hồ Chí Minh / Sân bay Tân Sơn Nhất"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Điểm kết thúc</label>
                <input
                  name="returnLocation"
                  value={formData.returnLocation ?? ''}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/70 focus:outline-none"
                  placeholder="TP. Hồ Chí Minh / Sân bay Tân Sơn Nhất"
                />
              </div>
            </div>
          </div>

          {/* ================== 7. Cài đặt ================== */}
          <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-7 py-5">
              <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                <span className="text-2xl">⚙️</span> Cài đặt nâng cao
              </h2>
            </div>
            <div className="flex flex-wrap gap-8 p-7">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured ?? false}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Tour nổi bật (Featured)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isHotDeal"
                  checked={formData.isHotDeal ?? false}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-gray-700">Hot Deal (Khuyến mãi đặc biệt)</span>
              </label>
            </div>
          </div>

          {/* ================== ACTION BUTTONS ================== */}
          <div className="flex flex-col justify-end gap-4 pt-6 sm:flex-row sm:items-center">
            <Link
              href="/tours"
              className="rounded-lg border border-gray-300 px-8 py-3 text-center text-gray-700 font-medium transition hover:border-gray-400 hover:bg-gray-50/80"
            >
              Hủy
            </Link>

            <button
              type="submit"
              disabled={loading}
              className={`
                flex items-center justify-center gap-2 rounded-lg px-8 py-3 font-medium text-white shadow transition min-w-[160px]
                ${loading
                  ? 'cursor-not-allowed bg-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }
              `}
            >
              <Save size={18} />
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật tour' : 'Tạo tour'}
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}