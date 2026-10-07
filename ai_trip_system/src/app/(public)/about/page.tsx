"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Users, 
  Target, 
  Heart, 
  MapPin, 
  Brain,
  Shield,
  Zap,
  Award
} from "lucide-react";

export default function AboutPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stats = [
    { number: "10,000+", label: "Khách hàng hài lòng" },
    { number: "500+", label: "Điểm đến" },
    { number: "50+", label: "Tour độc đáo" },
    { number: "4.8/5", label: "Đánh giá trung bình" }
  ];

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Thông Minh",
      description: "Sử dụng Google Gemini AI để gợi ý tour phù hợp với sở thích của bạn"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Điểm Đến Đa Dạng",
      description: "Hàng trăm địa điểm du lịch từ Bắc đến Nam Việt Nam"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Đảm Bảo An Toàn",
      description: "Cam kết chất lượng dịch vụ và bảo mật thông tin khách hàng"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Đặt Tour Nhanh",
      description: "Quy trình đặt tour đơn giản, thanh toán an toàn"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Hỗ Trợ 24/7",
      description: "Chatbot AI và team support luôn sẵn sàng hỗ trợ bạn"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Giá Tốt Nhất",
      description: "Cam kết giá tour tốt nhất thị trường với nhiều ưu đãi"
    }
  ];

  const team = [
    {
      name: "AI Engine Team",
      role: "Phát triển AI & Machine Learning",
      image: "/images/team-ai.jpg",
      description: "Đội ngũ chuyên gia AI phát triển hệ thống gợi ý thông minh"
    },
    {
      name: "Tour Planning Team",
      role: "Thiết kế & Quản lý Tour",
      image: "/images/team-tour.jpg",
      description: "Chuyên gia du lịch với kinh nghiệm 10+ năm"
    },
    {
      name: "Customer Support",
      role: "Chăm sóc khách hàng",
      image: "/images/team-support.jpg",
      description: "Hỗ trợ khách hàng 24/7 với chatbot AI và team nhiệt tình"
    },
    {
      name: "Tech Development",
      role: "Phát triển Website & App",
      image: "/images/team-tech.jpg",
      description: "Đội ngũ lập trình viên tài năng xây dựng nền tảng"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16 mx-auto" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Về Chúng Tôi
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl max-w-3xl mb-8"
          >
            Nền tảng gợi ý tour du lịch thông minh bằng AI - 
            Biến mọi chuyến đi thành trải nghiệm khó quên
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <Image
              src="/logo/travelVN.png"
              alt="TravelVN Logo"
              width={200}
              height={60}
              className="brightness-0 invert"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-10 h-10 text-blue-600" />
                <h2 className="text-4xl font-bold text-gray-800">Sứ Mệnh</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Chúng tôi tin rằng mỗi chuyến đi là một câu chuyện đáng nhớ. 
                Với sứ mệnh mang đến trải nghiệm du lịch tốt nhất, chúng tôi 
                kết hợp công nghệ AI hiện đại với kinh nghiệm du lịch sâu rộng 
                để giúp bạn khám phá Việt Nam một cách trọn vẹn nhất.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Từ những bãi biển xanh ngát ở Phú Quốc, núi rừng hùng vĩ ở Sa Pa, 
                đến phố cổ Hội An lung linh - chúng tôi đưa bạn đến mọi miền đất nước 
                với những tour được thiết kế chỉnh chu và gợi ý thông minh.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1528127269322-539801943592?w=800"
                alt="Vietnam Tourism"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Tại Sao Chọn Chúng Tôi?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Những tính năng vượt trội giúp bạn có trải nghiệm đặt tour tuyệt vời nhất
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-10 h-10 text-purple-600" />
              <h2 className="text-4xl font-bold text-gray-800">Đội Ngũ</h2>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Những con người đam mê đứng sau nền tảng AI Travel
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-24 h-24 text-white/50" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-purple-600 font-semibold mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Sẵn Sàng Khám Phá Việt Nam?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Để AI giúp bạn tìm tour hoàn hảo cho chuyến đi tiếp theo
            </p>
            <button
              onClick={() => window.location.href = '/intro'}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              Khám Phá Ngay
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
