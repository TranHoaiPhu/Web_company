/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Send, X, Check } from 'lucide-react';
import Link from 'next/link';
import StepBasicInfo from './steps/StepBasicInfo';
import StepAmenities from './steps/StepAmenities';
import StepSchedules from './steps/StepSchedules';
import StepItinerary from './steps/StepItinerary';
import StepImages from './steps/StepImages';
import StepReview from './steps/StepReview';

const STEPS = [
    { id: 1, label: "Basic Info", description: "Tour details" },
    { id: 2, label: "Amenities", description: "Features & services" },
    { id: 3, label: "Schedules", description: "Dates & availability" },
    { id: 4, label: "Itinerary", description: "Day-by-day plan" },
    { id: 5, label: "Images", description: "Visual gallery" },
    { id: 6, label: "Review", description: "Final check" }
];

const TourWizardRedesign = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    // State cho dữ liệu tour và id (nếu cần)
    const [tourData, setTourData] = useState<any>({
        durationDays: 1,
        durationNights: 0,
        maxParticipants: 10
    });
    const [tourId, setTourId] = useState<string | undefined>(undefined);

    // Validate bước 1 (dùng cho StepBasicInfo)
    const isStep1Valid = tourData && tourData.name && tourData.basePrice && tourData.durationDays !== undefined && tourData.locationId;

    const handleDataChange = (newData: any) => {
        setTourData((prev: any) => ({ ...prev, ...newData }));
    };

    const handleNext = (newTourId?: string) => {
        if (newTourId) {
            setTourId(newTourId);
            setTourData((prev: any) => ({ ...prev, id: newTourId }));
        }

        if (currentStep === 0 && !isStep1Valid && !newTourId) return;

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSaveDraft = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Draft saved successfully!');
        }, 1000);
    };

    const handlePublish = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert('Tour published successfully!');
        }, 1500);
    };

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-6 sticky top-0 z-40 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Chỉnh Sửa Tour</h1>
                            <p className="text-sm text-slate-600 mt-1">Bước {currentStep + 1} của {STEPS.length} • {STEPS[currentStep].label}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveDraft}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50 border border-slate-300"
                        >
                            <Save className="w-4 h-4" />
                            Lưu Nháp
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 shadow-md"
                        >
                            <Send className="w-4 h-4" />
                            Công Bố Tour
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full px-8 py-8 overflow-hidden flex gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full">
                    {/* Sidebar - Step Navigation */}
                    <div className="lg:col-span-1 hidden lg:block">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-32 h-fit shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-5 uppercase tracking-wide">Tiến Độ</h3>
                            <div className="space-y-2">
                                {STEPS.map((step, index) => (
                                    <button
                                        key={step.id}
                                        onClick={() => setCurrentStep(index)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all border-l-4 font-medium ${index === currentStep
                                            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                                            : index < currentStep
                                                ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                                                : 'border-transparent text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < currentStep
                                                ? 'bg-emerald-600 text-white'
                                                : index === currentStep
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {index < currentStep ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold">{step.label}</div>
                                                <div className="text-xs text-slate-500 truncate">{step.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
                            {/* Step Header */}
                            <div className="border-b border-slate-200 px-8 py-6 bg-gradient-to-r from-blue-50 to-white">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                        {currentStep + 1}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{STEPS[currentStep].label}</h2>
                                        <p className="text-sm text-slate-600">{STEPS[currentStep].description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                {currentStep === 0 && (
                                    <StepBasicInfo
                                        data={tourData}
                                        onChange={handleDataChange}
                                        onNext={handleNext}
                                    />
                                )}
                                {currentStep === 1 && (
                                    <StepAmenities
                                        tourId={tourId}
                                        onNext={handleNext}
                                        onBack={handleBack}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <StepSchedules
                                        tourId={tourId}
                                        onNext={handleNext}
                                        onBack={handleBack}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <StepItinerary
                                        tourId={tourId}
                                        onNext={handleNext}
                                        onBack={handleBack}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <StepImages
                                        tourId={tourId}
                                        onNext={handleNext}
                                        onBack={handleBack}
                                    />
                                )}
                                {currentStep === 5 && (
                                    <StepReview
                                        data={tourData}
                                        tourId={tourId}
                                        onBack={handleBack}
                                        onNext={handleNext}
                                    />
                                )}
                            </div>

                            {/* Navigation Footer */}
                            <div className="border-t border-slate-200 px-8 py-6 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleBack}
                                        disabled={currentStep === 0}
                                        className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Quay Lại
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {STEPS.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`rounded-full transition-all ${index === currentStep
                                                    ? 'w-8 h-2 bg-blue-600'
                                                    : index < currentStep
                                                        ? 'w-2 h-2 bg-emerald-600'
                                                        : 'w-2 h-2 bg-slate-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleNext()}
                                        disabled={currentStep === STEPS.length - 1 || (currentStep === 0 && !isStep1Valid)}
                                        className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Tiếp Theo
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl border border-slate-200">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm font-medium text-slate-600">Đang xử lý...</p>
                        </div>
                    </div>
                </div>
            )}

            </div>
    );
}

export default TourWizardRedesign;