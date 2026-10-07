import { Check } from "lucide-react";

// Trong file hiện tại hoặc tách riêng components/BookingSteps.tsx
export function BookingSteps() {
  const steps = [
    { id: 1, label: 'Chọn tour & Lịch trình', status: 'complete' },
    { id: 2, label: 'Điền thông tin', status: 'current' },
    { id: 3, label: 'Thanh toán & Xác nhận', status: 'upcoming' },
  ];

  return (
    <div className="bg-white sticky top-0 z-20 lg:static flex flex-col justify-between ">
        
        <div className="text-center mt-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight text-center">
            Hoàn tất đặt tour
          </h1>
          <p className="mt-1 text-sm text-gray-600 text-center">Vui lòng kiểm tra kỹ thông tin trước khi thanh toán</p>
        </div>
        
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-5">
        <div className="flex items-center justify-between">
          {/* Mobile: chỉ hiện step hiện tại */}
          <div className="lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              Bước 2: Điền thông tin
            </h2>
            <p className="text-sm text-gray-500">Hoàn tất để tiếp tục thanh toán</p>
          </div>

          {/* Desktop: progress bar */}
          <div className="hidden lg:flex w-full items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center">
                {/* Circle + Label */}
                <div className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step.status === 'complete'
                        ? 'bg-green-500 text-white'
                        : step.status === 'current'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.status === 'complete' ? <Check size={18} /> : step.id}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                      step.status === 'current'
                        ? 'text-blue-700 font-semibold'
                        : step.status === 'complete'
                        ? 'text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Line nối (trừ step cuối) */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative">
                    <div
                      className={`absolute inset-0 transition-all duration-500 ${
                        step.status === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}