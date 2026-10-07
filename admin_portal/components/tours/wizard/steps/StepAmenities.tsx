/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import httpTour from '@/services/http-tour'; // Direct http usage for sub-resources or create dedicated service
import { Plus, X, Check, Search } from 'lucide-react';

interface StepProps {
    tourId?: string;
    onNext: (tourId?: string) => void;
    onBack: () => void;
}

interface Amenity {
    id: number;
    name: string;
    category: string;
    icon?: string;
}

interface TourAmenity extends Amenity {
    isIncluded: boolean;
    isOptional: boolean;
    price: number;
}

export default function StepAmenities({ tourId, onNext, onBack }: StepProps) {
    const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<TourAmenity[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!tourId) return;
        fetchData();
    }, [tourId]);

    const fetchData = async () => {
        try {
            const [allRes, tourRes] = await Promise.all([
                httpTour.get('amenities?is_active=true'),
                httpTour.get(`amenities/tour/${tourId}`)
            ]);
            setAllAmenities(allRes.data.data);

            // Merge included and optional
            const tourAms = [
                ...tourRes.data.data.included.map((a: any) => ({ ...a, isIncluded: true })),
                ...tourRes.data.data.optional.map((a: any) => ({ ...a, isIncluded: false, isOptional: true }))
            ];
            setSelectedAmenities(tourAms);
        } catch (error) {
            console.error("Failed to fetch amenities", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (amenity: Amenity) => {
        try {
            await httpTour.post('amenities/tour', {
                tourId,
                amenityId: amenity.id,
                isIncluded: true,
                isOptional: false,
                price: 0
            });
            // Optimistic update
            setSelectedAmenities(prev => [...prev, { ...amenity, isIncluded: true, isOptional: false, price: 0 }]);
        } catch (error) {
            console.error("Failed to add amenity", error);
        }
    };

    const handleRemove = async (amenityId: number) => {
        try {
            await httpTour.delete('amenities/tour', { data: { tourId, amenityId } });
            setSelectedAmenities(prev => prev.filter(a => a.id !== amenityId));
        } catch (error) {
            console.error("Failed to remove amenity", error);
        }
    };

    const handleToggleType = async (amenity: TourAmenity, field: 'isIncluded' | 'isOptional') => {
        const updates = {
            isIncluded: field === 'isIncluded' ? !amenity.isIncluded : false,
            isOptional: field === 'isOptional' ? !amenity.isOptional : false,
        };
        // Ensure mutual exclusivity logic if needed (usually included OR optional)
        if (field === 'isIncluded' && updates.isIncluded) updates.isOptional = false;
        if (field === 'isOptional' && updates.isOptional) updates.isIncluded = false;

        try {
            await httpTour.post('amenities/tour', {
                tourId,
                amenityId: amenity.id,
                ...updates,
                price: amenity.price
            });

            setSelectedAmenities(prev => prev.map(a =>
                a.id === amenity.id ? { ...a, isIncluded: updates.isIncluded, isOptional: updates.isOptional } : a
            ));

        } catch (error) {
            console.error("Failed to update amenity", error);
        }
    };

    const filteredAmenities = allAmenities.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) &&
        !selectedAmenities.find(sa => sa.id === a.id)
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 min-h-[400px] font-[Roboto,sans-serif]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Left: Available */}
                <div className="border rounded-lg p-4 flex flex-col h-[500px] font-[Roboto,sans-serif] bg-gradient-to-br from-blue-50 to-white">
                    <h3 className="font-medium text-gray-900 mb-3">Available Amenities</h3>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {loading ? <p className="text-sm text-gray-500">Loading...</p> :
                            filteredAmenities.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No amenities found</p> :
                                filteredAmenities.map(amenity => (
                                    <div key={amenity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 group">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{amenity.name}</p>
                                            <p className="text-xs text-gray-500">{amenity.category}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(amenity)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ))}
                    </div>
                </div>

                {/* Right: Selected */}
                <div className="border rounded-lg p-4 flex flex-col h-[500px] bg-blue-50 font-[Roboto,sans-serif]">
                    <h3 className="font-medium text-gray-900 mb-3">Selected for Tour</h3>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {selectedAmenities.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                                <p>No amenities selected</p>
                                <p className="text-xs">Add amenities from the list</p>
                            </div>
                        )}
                        {selectedAmenities.map(amenity => (
                            <div key={amenity.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{amenity.name}</p>
                                        <p className="text-xs text-gray-500">{amenity.category}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(amenity.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        onClick={() => handleToggleType(amenity, 'isIncluded')}
                                        className={`flex items-center gap-1 px-2 py-1 rounded border ${amenity.isIncluded ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {amenity.isIncluded && <Check size={12} />} Included
                                    </button>
                                    <button
                                        onClick={() => handleToggleType(amenity, 'isOptional')}
                                        className={`flex items-center gap-1 px-2 py-1 rounded border ${amenity.isOptional ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {amenity.isOptional && <Check size={12} />} Optional
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t font-[Roboto,sans-serif]">
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
                    Next: Schedules
                </button>
            </div>
        </div>
    );
}
