import { Tour, tourService } from '@/services/tour.service';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StepProps {
    data: Partial<Tour>;
    tourId?: string;
    onNext: (tourId?: string) => void;
    onBack: () => void;
}

export default function StepReview({ data, tourId, onBack, onNext }: StepProps) {
    const router = useRouter();

    const handlePublish = async () => {
        if (!tourId) return;
        try {
            await tourService.updateTour(tourId, { status: 'ACTIVE' });
            alert("Tour Published Successfully!");
            router.push('/tours');
        } catch (error) {
            alert("Failed to publish tour");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-0.5" size={20} />
                <div>
                    <h3 className="text-sm font-medium text-green-900">Ready to Publish</h3>
                    <p className="text-sm text-green-700 mt-1">
                        Please review all details below. Once published, your tour will be visible to all customers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">Basic Info</h4>
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Name:</dt>
                            <dd className="font-medium">{data.name}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Price:</dt>
                            <dd className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.basePrice || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Duration:</dt>
                            <dd className="font-medium">{data.durationDays} Days / {data.durationNights} Nights</dd>
                        </div>
                    </dl>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">Settings</h4>
                    <dl className="space-y-2">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Max Participants:</dt>
                            <dd className="font-medium">{data.maxParticipants}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex justify-between pt-8 border-t">
                <button
                    onClick={onBack}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                >
                    Back
                </button>
                <button
                    onClick={handlePublish}
                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
                >
                    Publish Tour
                </button>
            </div>
        </div>
    );
}
