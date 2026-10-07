import { useState, useEffect } from 'react';
import httpTour from '@/services/http-tour';
import { Plus, Trash2, MapPin, ChevronDown, ChevronRight, Clock, PlusCircle } from 'lucide-react';

interface StepProps {
    tourId?: string;
    onNext: (tourId?: string) => void;
    onBack: () => void;
}

interface Place {
    id: number;
    name: string;
}

interface TourDay {
    id?: number; // Only present if saved
    tempId?: string; // For local UI key before save
    dayNumber: number;
    title: string;
    description: string;
    places: any[];
}

export default function StepItinerary({ tourId, onNext, onBack }: StepProps) {
    const [days, setDays] = useState<TourDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDay, setExpandedDay] = useState<number | null>(null); // day_number
    const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);

    // New Day Form
    const [isAddingDay, setIsAddingDay] = useState(false);
    const [newDay, setNewDay] = useState({
        title: '',
        description: '',
        accommodation: '',
        meals: ''
    });

    useEffect(() => {
        if (!tourId) return;
        fetchData();
    }, [tourId]);

    const fetchData = async () => {
        try {
            // Need general tour details which includes itinerary
            const res = await httpTour.get(`tours/${tourId}`);
            if (res.data.data.itinerary) {
                setDays(res.data.data.itinerary);
            }
            // Fetch places for dropdown
            const placesRes = await httpTour.get('places');
            setAvailablePlaces(placesRes.data.data.places || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDay = async () => {
        try {
            const dayNum = days.length + 1;
            const res = await httpTour.post('tour-days', {
                tourId,
                dayNumber: dayNum,
                title: newDay.title,
                description: newDay.description,
                accommodation: newDay.accommodation,
                meals: newDay.meals
            });

            setDays(prev => [...prev, {
                id: res.data.data.id,
                dayNumber: res.data.data.dayNumber,
                title: res.data.data.title,
                description: res.data.data.description,
                places: []
            }]);

            setIsAddingDay(false);
            setNewDay({ title: '', description: '', accommodation: '', meals: '' });
            setExpandedDay(dayNum);
        } catch (error) {
            alert("Failed to add day");
        }
    };

    const handleDeleteDay = async (id: number) => {
        if (!confirm("Delete this day?")) return;
        try {
            await httpTour.delete(`tour-days/${id}`);
            setDays(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            alert("Failed to delete day");
        }
    };

    const handleAddPlace = async (dayId: number, placeId: string) => {
        if (!placeId) return;
        try {
            await httpTour.post(`tour-days/${dayId}/places`, {
                placeId: parseInt(placeId),
                visitOrder: 1, // Logic to find max order + 1
                durationMinutes: 60,
                notes: ''
            });
            fetchData(); // Refresh to get updated structure
        } catch (error) {
            alert("Failed to add place");
        }
    };

    const handleRemovePlace = async (dayPlaceId: number) => {
        try {
            await httpTour.delete(`tour-days/places/${dayPlaceId}`);
            fetchData();
        } catch (error) {
            alert("Failed to remove place");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Itinerary</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Plan the day-by-day experience</p>
                </div>
                <button
                    onClick={() => setIsAddingDay(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Plus size={18} />
                    Add Day {days.length + 1}
                </button>
            </div>

            {isAddingDay && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-in slide-in-from-top-2">
                    <h4 className="font-semibold text-blue-900 mb-4">New Day Details</h4>
                    <div className="space-y-4">
                        <input
                            placeholder="Day Title (e.g., Arrival in Da Nang)"
                            className="w-full px-4 py-2.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                            value={newDay.title}
                            onChange={e => setNewDay(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <textarea
                            placeholder="Description of activities..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm resize-none"
                            value={newDay.description}
                            onChange={e => setNewDay(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Accommodation"
                                className="w-full px-4 py-2.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                                value={newDay.accommodation}
                                onChange={e => setNewDay(prev => ({ ...prev, accommodation: e.target.value }))}
                            />
                            <input
                                placeholder="Meals (e.g., B, L, D)"
                                className="w-full px-4 py-2.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                                value={newDay.meals}
                                onChange={e => setNewDay(prev => ({ ...prev, meals: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAddingDay(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors font-medium">Cancel</button>
                            <button onClick={handleAddDay} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">Save Day</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {days.map((day) => (
                    <div key={day.id || day.tempId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                    {day.dayNumber}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{day.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-1">{day.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {day.id && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id!); }} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="p-2 text-slate-400">
                                    {expandedDay === day.dayNumber ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </div>
                        </div>

                        {/* Day Content */}
                        {expandedDay === day.dayNumber && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                                {/* Places List */}
                                <div className="space-y-3 relative pl-6">
                                    <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-blue-100" />

                                    {day.places?.map((place: any) => (
                                        <div key={place.id} className="relative group">
                                            <div className="absolute -left-[1.35rem] top-3.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                                            <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border flex items-center justify-center text-xs font-bold text-slate-400">
                                                        {place.visitOrder}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{place.place.name}</p>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                                            <span className="flex items-center gap-1 text-blue-500"><Clock size={12} /> {place.durationMinutes}m</span>
                                                            <span className="flex items-center gap-1 text-slate-500"><MapPin size={12} /> {place.place.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemovePlace(place.id)}
                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                >
                                                    <XIcon size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Place Row */}
                                    <div className="flex items-center gap-3 pt-2 relative">
                                        <div className="absolute -left-[1.35rem] top-5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white" />
                                        <div className="flex-1 flex items-center gap-2">
                                            <select
                                                className="flex-1 text-sm border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none bg-white transition-all shadow-sm"
                                                onChange={(e) => handleAddPlace(day.id!, e.target.value)}
                                                value=""
                                            >
                                                <option value="" disabled>Add a stop to Day {day.dayNumber}...</option>
                                                {Array.isArray(availablePlaces) && availablePlaces.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-200">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={() => onNext()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-sm"
                >
                    Next: Images
                </button>
            </div>
        </div>
    );
}

// Helper icon
function XIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
