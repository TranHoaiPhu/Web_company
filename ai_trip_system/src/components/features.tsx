import Image from "next/image";

const features = [
  {
    name: "Lập kế hoạch với AI.",
    description:
      "Dựa trên sở thích và nhu cầu của bạn, AI sẽ tạo ra một lịch trình du lịch hoàn hảo.",
  },
  {
    name: "Du lịch cùng bạn bè.",
    description:
      "Hỗ trợ kết nối bạn bè và gia đình để cùng nhau lên kế hoạch cho chuyến đi.",
  },
  {
    name: "Sự hỗ trợ 24/7.",
    description:
      "Chúng tôi cung cấp hỗ trợ khách hàng 24/7 để đảm bảo bạn có trải nghiệm tốt nhất.",
  },
];

export default function Features() {
  return (
    <div className="overflow-hidden bg-transparent py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pt-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-white">
                Rút gọn quá trình
              </h2>
              <p className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                Du lịch nhanh hơn với{" "}
                <span className="text-white font-bold">Explavue!</span>
              </p>
              <p className="mt-6 text-lg/8 text-gray-100">
                Explavue giúp bạn tiết kiệm thời gian và công sức trong việc lên
                kế hoạch cho chuyến đi. Với nền tảng của chúng tôi, bạn có thể
                dễ dàng tìm kiếm, so sánh và đặt các dịch vụ du lịch chỉ trong
                vài phút.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-100 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-white">
                      {feature.name}
                    </dt>{" "}
                    <dd className="inline text-gray-100">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="relative mt-16 h-80 lg:mt-8">
            <Image
              alt="Halong Bay"
              src="/destinations/halong.jpg"
              width={1824}
              height={1080}
              className="w-[48rem] max-w-none rounded-xl shadow-xl sm:w-[57rem] md:-ml-4 lg:-ml-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
