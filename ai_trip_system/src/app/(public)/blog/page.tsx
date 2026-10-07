"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Compass,
  Camera,
  Heart,
  Star
} from "lucide-react";
import { useState } from "react";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const categories = [
    { id: "all", name: "Tất cả", icon: <Compass className="w-4 h-4" /> },
    { id: "tips", name: "Tips Du Lịch", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "destinations", name: "Điểm Đến", icon: <MapPin className="w-4 h-4" /> },
    { id: "food", name: "Ẩm Thực", icon: <Heart className="w-4 h-4" /> },
    { id: "photography", name: "Nhiếp Ảnh", icon: <Camera className="w-4 h-4" /> }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "10 Địa Điểm Không Thể Bỏ Lỡ Khi Du Lịch Đà Lạt",
      excerpt: "Khám phá những địa điểm đẹp nhất tại thành phố ngàn hoa với hướng dẫn chi tiết và tips tiết kiệm chi phí.",
      category: "destinations",
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
      author: "Nguyễn Văn A",
      date: "2026-01-20",
      readTime: "5 phút",
      featured: true,
      tags: ["Đà Lạt", "Miền Trung", "Núi Rừng"]
    },
    {
      id: 2,
      title: "Kinh Nghiệm Du Lịch Phú Quốc Tự Túc Chi Tiết Nhất",
      excerpt: "Hướng dẫn từ A-Z để có chuyến du lịch Phú Quốc tiết kiệm nhưng vẫn trọn vẹn trải nghiệm.",
      category: "tips",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      author: "Trần Thị B",
      date: "2026-01-18",
      readTime: "8 phút",
      featured: true,
      tags: ["Phú Quốc", "Biển Đảo", "Tự Túc"]
    },
    {
      id: 3,
      title: "Món Ăn Đường Phố Sài Gòn Phải Thử Một Lần",
      excerpt: "Danh sách những món ăn đường phố nổi tiếng nhất Sài Gòn mà du khách không nên bỏ lỡ.",
      category: "food",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      author: "Lê Văn C",
      date: "2026-01-15",
      readTime: "6 phút",
      featured: false,
      tags: ["Sài Gòn", "Ẩm Thực", "Street Food"]
    },
    {
      id: 4,
      title: "Bí Quyết Chụp Ảnh Du Lịch Đẹp Như Travel Blogger",
      excerpt: "Những tips nhiếp ảnh đơn giản giúp bạn có những bức ảnh du lịch ấn tượng chỉ với smartphone.",
      category: "photography",
      image: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800",
      author: "Phạm Thị D",
      date: "2026-01-12",
      readTime: "7 phút",
      featured: false,
      tags: ["Photography", "Tips", "Smartphone"]
    },
    {
      id: 5,
      title: "Hà Nội 36 Phố Phường: Hướng Dẫn Khám Phá Phố Cổ",
      excerpt: "Cẩm nang chi tiết về lịch sử, văn hóa và những trải nghiệm thú vị tại phố cổ Hà Nội.",
      category: "destinations",
      image: "https://images.unsplash.com/photo-1555891673-ec9e59a558fa?w=800",
      author: "Hoàng Văn E",
      date: "2026-01-10",
      readTime: "10 phút",
      featured: false,
      tags: ["Hà Nội", "Phố Cổ", "Văn Hóa"]
    },
    {
      id: 6,
      title: "Checklist Du Lịch Hoàn Hảo: Đừng Quên Gì Khi Đi Tour",
      excerpt: "Danh sách đầy đủ những thứ cần chuẩn bị cho chuyến du lịch của bạn, từ giấy tờ đến đồ dùng cá nhân.",
      category: "tips",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
      author: "Nguyễn Thị F",
      date: "2026-01-08",
      readTime: "5 phút",
      featured: false,
      tags: ["Tips", "Checklist", "Chuẩn Bị"]
    },
    {
      id: 7,
      title: "Sa Pa Mùa Nào Đẹp Nhất? Hướng Dẫn Chọn Thời Điểm",
      excerpt: "Phân tích chi tiết về từng mùa tại Sa Pa để bạn chọn được thời điểm phù hợp nhất cho chuyến đi.",
      category: "destinations",
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
      author: "Trần Văn G",
      date: "2026-01-05",
      readTime: "6 phút",
      featured: false,
      tags: ["Sa Pa", "Mùa Du Lịch", "Miền Bắc"]
    },
    {
      id: 8,
      title: "Top 5 Quán Cà Phê View Đẹp Nhất Đà Nẵng",
      excerpt: "Những quán cà phê có view tuyệt đẹp tại Đà Nẵng, lý tưởng để ngắm biển và check-in.",
      category: "food",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      author: "Lê Thị H",
      date: "2026-01-03",
      readTime: "4 phút",
      featured: false,
      tags: ["Đà Nẵng", "Cà Phê", "View Đẹp"]
    },
    {
      id: 9,
      title: "Du Lịch Hội An: Trải Nghiệm Phố Cổ Về Đêm",
      excerpt: "Khám phá vẻ đẹp lung linh của Hội An khi màn đêm buông xuống với hàng ngàn đèn lồng rực rỡ.",
      category: "destinations",
      image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
      author: "Phạm Văn I",
      date: "2025-12-28",
      readTime: "7 phút",
      featured: false,
      tags: ["Hội An", "Phố Cổ", "Đêm Đẹp"]
    }
  ];

  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Blog Du Lịch
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Khám phá Việt Nam qua những câu chuyện, tips và trải nghiệm thực tế
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>50+ Bài viết</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>Cập nhật hàng tuần</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3"
            >
              <Star className="w-8 h-8 text-yellow-500" />
              Bài Viết Nổi Bật
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-64">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        NỔI BẬT
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 hover:text-purple-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{post.author}</span>
                      </div>
                      <Link 
                        href={`/blog/${post.id}`}
                        className="text-purple-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                      >
                        Đọc tiếp <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-3xl font-bold text-gray-800 mb-8"
          >
            {selectedCategory === "all" ? "Tất Cả Bài Viết" : categories.find(c => c.id === selectedCategory)?.name}
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative h-48">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">{post.author}</span>
                    </div>
                    <Link 
                      href={`/blog/${post.id}`}
                      className="text-purple-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Xem <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">
              Đăng Ký Nhận Bài Viết Mới
            </h2>
            <p className="text-lg mb-8">
              Nhận thông báo về bài viết mới và các tips du lịch hữu ích mỗi tuần
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                Đăng Ký
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
