import { useState, useEffect } from 'react';
import httpTour from '@/services/http-tour';
import { Plus, Trash2, Calendar, Users, DollarSign, Loader2 } from 'lucide-react';

interface StepProps {
    tourId?: string;
    onNext: (tourId?: string) => void;
    onBack: () => void;
}

interface Schedule {
    id: string;
    startDate: string;
    endDate: string;
    totalSlots: number;
    availableSlots: number;
    priceOverride?: number;
    status: string;
}

export default function StepSchedules({ tourId, onNext, onBack }: StepProps) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // New schedule form state
    const [newSchedule, setNewSchedule] = useState({
        startDate: '',
        endDate: '',
        totalSlots: 20,
        priceOverride: '',
        status: 'OPEN'
    });

    useEffect(() => {
        if (!tourId) return;
        fetchSchedules();
    }, [tourId]);

    const fetchSchedules = async () => {
        try {
            const res = await httpTour.get(`tours/${tourId}`);
            if (res.data.data.upcomingSchedules) {
                setSchedules(res.data.data.upcomingSchedules.map((s: any) => ({
                    id: s.scheduleId,
                    startDate: s.startDate,
                    endDate: s.endDate,
                    totalSlots: s.totalSlots,
                    availableSlots: s.availableSlots,
                    priceOverride: s.priceOverride,
                    status: s.status
                })));
                // in log 
                console.log("Schedules", schedules);
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const res = await httpTour.post('tour-schedules', {
                tourId,
                startDate: newSchedule.startDate,
                endDate: newSchedule.endDate || undefined,
                totalSlots: newSchedule.totalSlots,
                priceOverride: newSchedule.priceOverride ? parseFloat(newSchedule.priceOverride) : undefined,
                status: newSchedule.status
            });

            setSchedules(prev => [...prev, {
                id: res.data.data.id,
                startDate: res.data.data.startDate,
                endDate: res.data.data.endDate,
                totalSlots: res.data.data.totalSlots,
                availableSlots: res.data.data.availableSlots,
                priceOverride: res.data.data.priceOverride,
                status: res.data.data.status
            }]);
            setIsCreating(false);
            setNewSchedule({
                startDate: '',
                endDate: '',
                totalSlots: 20,
                priceOverride: '',
                status: 'OPEN'
            });
        } catch (error) {
            console.error("Failed to create schedule", error);
            alert("Failed to create schedule");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this schedule?")) return;
        try {
            await httpTour.delete(`tour-schedules/${id}`);
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Departure Schedules</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Manage tour availability and dates</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                    disabled={!tourId}
                >
                    <Plus size={18} />
                    Add Schedule
                </button>
            </div>

            {isCreating && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-semibold text-blue-900 mb-4">New Departure Date</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5 uppercase tracking-wider">Start Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newSchedule.startDate}
                                onChange={e => setNewSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5 uppercase tracking-wider">End Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newSchedule.endDate}
                                onChange={e => setNewSchedule(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5 uppercase tracking-wider">Total Slots</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newSchedule.totalSlots}
                                onChange={e => setNewSchedule(prev => ({ ...prev, totalSlots: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5 uppercase tracking-wider">Price Override</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                placeholder="Base price"
                                value={newSchedule.priceOverride}
                                onChange={e => setNewSchedule(prev => ({ ...prev, priceOverride: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5 uppercase tracking-wider">Status</label>
                            <select
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newSchedule.status}
                                onChange={e => setNewSchedule(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="OPEN">Open</option>
                                <option value="FULL">Full</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                            {saving ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Departure</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Slots</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Price Override</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {schedules.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                                    <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>No schedules added yet.</p>
                                </td>
                            </tr>
                        ) : (
                            schedules.map(schedule => (
                                <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-500" />
                                            {(() => {
                                                const dateStr = schedule.startDate;
                                                if (!dateStr) return <span className="text-red-500">Chưa chọn ngày</span>;

                                                const date = new Date(dateStr);
                                                if (!isNaN(date.getTime())) {
                                                    return date.toLocaleDateString('vi-VN');
                                                }

                                                // Hiển thị giá trị gốc nếu parse thất bại để debug
                                                return <span>{String(dateStr)}</span>;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-slate-400" />
                                            <span>{schedule.availableSlots} / {schedule.totalSlots}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-green-600 font-medium">
                                        {schedule.priceOverride ? (
                                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(schedule.priceOverride)
                                        ) : (
                                            <span className="text-slate-400 italic font-normal">Base Price</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold 
                                            ${schedule.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {schedule.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(schedule.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
                    Next: Itinerary
                </button>
            </div>
        </div>
    );
}