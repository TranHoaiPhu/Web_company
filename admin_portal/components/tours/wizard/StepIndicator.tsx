import { Check } from "lucide-react";

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-300"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center bg-gray-50 px-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                        isCurrent ? 'bg-white border-blue-600 text-blue-600' :
                                            'bg-white border-gray-300 text-gray-300'}`}
                            >
                                {isCompleted ? <Check size={16} /> : <span>{index + 1}</span>}
                            </div>
                            <span className={`text-xs font-medium mt-2 hidden sm:block
                                ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
