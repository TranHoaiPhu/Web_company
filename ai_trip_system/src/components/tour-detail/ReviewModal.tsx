"use client";

import { useState } from "react";
import { FaStar, FaTimes, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { tourService } from "@/services/tours/tour.service";
import { toast } from "react-toastify";
import ImageUpload from "../common/ImageUpload";
import Image from "next/image";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId: string;
    orderId: number;
    tourName: string;
    onSuccess: () => void;
}

export default function ReviewModal({ isOpen, onClose, tourId, orderId, tourName, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleImageUploaded = (url: string) => {
        setImages((prev) => [...prev, url]);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment) {
            toast.error("Vui lòng nhập nội dung đánh giá");
            return;
        }

        try {
            setLoading(true);
            const res = await tourService.submitReview(tourId, {
                orderId,
                rating,
                title,
                comment,
                images: images
            }) as { success: boolean };

            if (res.success) {
                toast.success("Cảm ơn bạn đã đánh giá tour!");
                onSuccess();
                onClose();
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi gửi đánh giá");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 sm:p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Đánh giá tour</h3>
                                    <p className="text-gray-500 text-sm line-clamp-1">{tourName}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <FaTimes className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Star Rating */}
                                <div className="text-center space-y-2">
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="text-4xl transition-all active:scale-90"
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <FaStar
                                                    className={
                                                        (hover || rating) >= star ? "text-yellow-400" : "text-gray-200"
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-semibold text-blue-600">
                                        {rating === 5 ? "Tuyệt vời!" : rating === 4 ? "Rất tốt" : rating === 3 ? "Bình thường" : rating === 2 ? "Tệ" : "Rất tệ"}
                                    </p>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề (Tùy chọn)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Tóm tắt cảm nhận của bạn..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Chia sẻ trải nghiệm của bạn</label>
                                    <textarea
                                        rows={4}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Chuyến đi như thế nào? Bạn hài lòng với dịch vụ nào nhất?..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-700">Hình ảnh chuyến đi</label>

                                    {/* Uploaded Images Gallery */}
                                    {images.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {images.map((url, idx) => (
                                                <div key={idx} className="relative group w-20 h-20">
                                                    <Image
                                                        src={url}
                                                        alt={`Upload ${idx}`}
                                                        fill
                                                        className="object-cover rounded-xl border border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FaTimes className="text-[10px]" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <ImageUpload
                                        onUploadSuccess={handleImageUploaded}
                                        label=""
                                        className="mt-0"
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            "Gửi đánh giá"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
