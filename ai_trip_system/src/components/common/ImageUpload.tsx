"use client";

import { useState, useRef } from "react";
import { FaCloudUploadAlt, FaTimes, FaSpinner } from "react-icons/fa";
import { uploadService } from "@/services/upload.service";
import { toast } from "react-toastify";
import Image from "next/image";

interface ImageUploadProps {
    onUploadSuccess: (url: string) => void;
    label?: string;
    className?: string;
}

export default function ImageUpload({ onUploadSuccess, label = "Tải ảnh lên", className = "" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng chọn tệp hình ảnh");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }

        // Show preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
            setUploading(true);
            const imageUrl = await uploadService.uploadImage(file);
            onUploadSuccess(imageUrl);
            toast.success("Tải ảnh thành công!");
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || "Không thể tải ảnh lên");
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <label className="block text-sm font-bold text-gray-700">{label}</label>}

            <div className="relative group">
                {!preview ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group lg:min-h-[160px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FaCloudUploadAlt className="text-2xl text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">Chọn ảnh hoặc kéo thả vào đây</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100 border border-gray-200">
                        <Image src={preview} alt="Preview" fill className="object-contain" />

                        {uploading ? (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                <FaSpinner className="text-3xl animate-spin mb-2" />
                                <span className="text-sm font-bold">Đang tải lên...</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
        </div>
    );
}
