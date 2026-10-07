import { useState, useEffect } from 'react';
import httpTour from '@/services/http-tour';
import { Upload, X, Star, Image as ImageIcon, Trash2 } from 'lucide-react';

interface StepProps {
    tourId?: string;
    onNext: (tourId?: string) => void;
    onBack: () => void;
}

interface TourImage {
    imageId: number;
    imageUrl: string;
    isCover: boolean;
}

export default function StepImages({ tourId, onNext, onBack }: StepProps) {
    const [images, setImages] = useState<TourImage[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);

    useEffect(() => {
        if (!tourId) return;
        fetchImages();
    }, [tourId]);

    const fetchImages = async () => {
        try {
            const res = await httpTour.get(`tour-images/tour/${tourId}`);
            setImages(res.data.data);
        } catch (error) {
            console.error("Failed to fetch images", error);
        }
    };

    const handleAddImage = async () => {
        if (!newImageUrl) return;
        setLoading(true);
        try {
            const isFirst = images.length === 0;
            const res = await httpTour.post('tour-images', {
                tourId,
                imageUrl: newImageUrl,
                isCover: isFirst
            });
            setImages(prev => [...prev, {
                imageId: res.data.data.imageId,
                imageUrl: res.data.data.imageUrl,
                isCover: res.data.data.isCover
            }]);
            setNewImageUrl('');
        } catch (error) {
            alert("Failed to add image");
        } finally {
            setLoading(false);
        }
    };

    // Option 2: Pick file from device and get URL
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            // Upload to the new endpoint
            // Explicitly set Content-Type to undefined to let axios handle FormData correctly
            const res = await httpTour.post('tour-images/upload', formData, {
                headers: {
                    'Content-Type': undefined
                }
            });

            // Key change: instead of adding to tour, populate the URL input
            if (res.data.success && res.data.data.imageUrl) {
                setNewImageUrl(res.data.data.imageUrl);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setFileUploading(false);
            // Clear input so same file can be picked again
            e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete image?")) return;
        try {
            await httpTour.delete(`tour-images/${id}`);
            setImages(prev => prev.filter(img => img.imageId !== id));
        } catch (error) {
            alert("Failed to delete image");
        }
    };

    const handleSetCover = async (image: TourImage) => {
        if (image.isCover) return;
        try {
            await httpTour.put(`tour-images/${image.imageId}`, {
                isCover: true
            });
            // Update local state: set all isCover=false, then this one true
            setImages(prev => prev.map(img => ({
                ...img,
                isCover: img.imageId === image.imageId
            })));
        } catch (error) {
            alert("Failed to set cover");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Thêm ảnh cho tour</h3>
                        <p className="text-xs text-gray-500 mt-1">Chọn 1 trong 2 cách: Dán link ảnh hoặc chọn file từ máy</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        {/* Option 1: Dán URL */}
                        <div className="flex gap-2">
                            <input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="flex-1 px-3 py-2 border rounded-md text-sm"
                            />
                            <button
                                onClick={handleAddImage}
                                disabled={loading || !newImageUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang thêm...' : 'Thêm link'}
                            </button>
                        </div>
                        {/* Option 2: Chọn file (Pick into URL) */}
                        <div className="relative">
                            <input
                                type="file"
                                id="file-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={fileUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl cursor-pointer hover:bg-blue-50 transition-all font-semibold ${fileUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {fileUploading ? (
                                    <>
                                        <X className="animate-spin" size={18} />
                                        Đang tải ảnh...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={18} />
                                        Chọn từ máy tính (Tự điền URL)
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img.imageId} className={`group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 ${img.isCover ? 'border-blue-600' : 'border-transparent'}`}>
                        <img src={img.imageUrl} alt="Tour" className="w-full h-full object-cover" />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleSetCover(img)}
                                title="Set as Cover"
                                className={`p-1.5 rounded-full ${img.isCover ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                            >
                                <Star size={16} fill={img.isCover ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => handleDelete(img.imageId)}
                                className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {img.isCover && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                Cover
                            </div>
                        )}
                    </div>
                ))}

                {images.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No images added yet</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4 border-t">
                <button
                    onClick={onBack}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                >
                    Back
                </button>
                <button
                    onClick={() => onNext()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Review & Publish
                </button>
            </div>
        </div>
    );
}
