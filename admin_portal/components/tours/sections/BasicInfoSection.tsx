interface BasicInfoSectionProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function BasicInfoSection({ formData, handleChange }: BasicInfoSectionProps) {
    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-4 mb-6 flex items-center gap-2">
                <span className="text-xl">📝</span> Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên tour *</label>
                    <input
                        required
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm shadow-sm hover:border-gray-400"
                        placeholder="Nhập tên tour..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm shadow-sm hover:border-gray-400"
                    >
                        <option value="DRAFT">Bản nháp</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Slug (tự động)</label>
                    <input
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm text-gray-500"
                        placeholder="tour-name-slug"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mã địa điểm *</label>
                    <input
                        required
                        name="locationId"
                        type="number"
                        value={formData.locationId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm shadow-sm hover:border-gray-400"
                        placeholder="1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mã danh mục</label>
                    <input
                        name="categoryId"
                        type="number"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm shadow-sm hover:border-gray-400"
                        placeholder="1"
                    />
                </div>
            </div>
        </div>
    );
}
