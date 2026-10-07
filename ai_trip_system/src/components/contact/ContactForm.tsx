"use client";

import { useState, FormEvent } from "react";
import { API_BASE_URL } from "@/config/api";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaPhone, FaTag, FaCommentDots, FaPaperPlane, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface FormData {
  fullname: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    fullname: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Gửi thông tin thất bại. Vui lòng thử lại.");
      }

      setSuccessMessage(
        "Cảm ơn bạn! Chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại sớm nhất."
      );
      setFormData({
        fullname: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 px-6 py-5 rounded-xl flex items-start gap-4 shadow-lg"
          >
            <FaCheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="font-bold text-lg">Thành công!</p>
              <p className="text-sm mt-1 text-green-700">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-800 px-6 py-5 rounded-xl flex items-start gap-4 shadow-lg"
          >
            <FaExclamationCircle className="w-6 h-6 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-bold text-lg">Lỗi!</p>
              <p className="text-sm mt-1 text-red-700">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Name */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="fullname" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <FaUser className="text-blue-500" />
          Họ và Tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="fullname"
          name="fullname"
          value={formData.fullname}
          onChange={handleChange}
          required
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800 placeholder-gray-400"
          placeholder="Nhập họ và tên của bạn"
        />
      </motion.div>

      {/* Email */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <FaEnvelope className="text-purple-500" />
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800 placeholder-gray-400"
          placeholder="example@email.com"
        />
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <FaPhone className="text-green-500" />
          Điện Thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800 placeholder-gray-400"
          placeholder="0123 456 789"
        />
      </motion.div>

      {/* Subject */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <FaTag className="text-orange-500" />
          Tiêu Đề <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800 placeholder-gray-400"
          placeholder="Vấn đề bạn muốn trao đổi"
        />
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <FaCommentDots className="text-pink-500" />
          Nội Dung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-800 placeholder-gray-400"
          placeholder="Mô tả chi tiết yêu cầu hoặc câu hỏi của bạn..."
        />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold py-5 px-8 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </motion.div>
            Đang gửi...
          </>
        ) : (
          <>
            <FaPaperPlane />
            Gửi Tin Nhắn
          </>
        )}
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-gray-500 text-sm flex items-center justify-center gap-2"
      >
        <FaCheckCircle className="text-green-500" />
        Chúng tôi sẽ phản hồi trong vòng 24 giờ
      </motion.p>
    </form>
  );
}
