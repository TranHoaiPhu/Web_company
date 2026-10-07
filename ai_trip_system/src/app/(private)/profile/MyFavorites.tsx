import { useState, useEffect } from "react";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import favoriteTourService from "@/services/tours/favorite-tour.service";
import { tourService } from "@/services/tours/tour.service";
import { mapTourApiToBase } from "@/mapper/tour.mapper";
import TourCard from "@/components/tours/TourCard";
import { TourBase } from "@/types/tour";

export default function MyFavorites() {
    const [favorites, setFavorites] = useState<TourBase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                setIsLoading(true);
                // 1. Lấy danh sách ID tour yêu thích từ Python BE
                const favData = await favoriteTourService.getMyFavorites();

                if (favData.length === 0) {
                    setFavorites([]);
                    return;
                }

                // 2. Lấy tất cả tour từ Node.js BE để map dữ liệu chi tiết
                const allTours = await tourService.getAll();

                // 3. Filter và map
                const favIds = favData.map(f => String(f.id_tour));
                const filteredTours = allTours
                    .filter(t => favIds.includes(String(t.id)))
                    .map(mapTourApiToBase);

                setFavorites(filteredTours);
            } catch (err) {
                console.error("Error fetching favorites:", err);
                setError("Không thể tải danh sách yêu thích");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const handleDelete = (tourId: string) => {
        setFavorites(prev => prev.filter(t => t.id !== tourId));
    };

    if (isLoading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-400">
                    <FaHeart size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Danh sách trống</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Bạn chưa lưu bất kỳ tour nào vào danh sách yêu thích.</p>
                <Link href="/tours" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Tìm tour ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((tour) => (
                <TourCard
                    key={tour.id}
                    tour={tour}
                    onFavoriteToggle={(isFav: boolean) => {
                        if (!isFav) handleDelete(tour.id);
                    }}
                />
            ))}
        </div>
    );
}
