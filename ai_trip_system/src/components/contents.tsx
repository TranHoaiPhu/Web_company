import Image from "next/image";

export default function Contents() {
  return (
    <div className="mx-auto max-w-full py-24 sm:px-6 sm:py-32 lg:px-8 bg-transparent flex items-center justify-center">
      <div className="relative isolate overflow-hidden w-7xl bg-cyan-600 backdrop-blur-md px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Du lịch thông minh với{" "}
            <span className="text-[#FFD700]">Explavue!</span>
          </h2>
          <p className="mt-6 text-lg/8 text-pretty text-gray-300">
            Hệ thống đề xuất lộ trình du lịch thông minh dựa trên AI.{" "}
            <span className="text-[#FFD700]">Explavue</span> giúp bạn tiết kiệm
            thời gian và công sức trong việc lên kế hoạch cho chuyến đi. Với nền
            tảng của chúng tôi, bạn có thể dễ dàng tìm kiếm, so sánh và đặt các
            dịch vụ du lịch chỉ trong vài phút.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
            <a
              href="/login"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Bắt đầu ngay! <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="relative mt-16 h-80 lg:mt-8">
          <Image
            alt="Sapa"
            src="/destinations/sapa.jpg"
            width={1824}
            height={1080}
            className="absolute top-15 left-0 w-[57rem] max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
          />
        </div>
      </div>
    </div>
  );
}
