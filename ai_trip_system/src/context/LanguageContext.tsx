"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  loadAllTranslations,
  getCachedTranslations,
} from "@/lib/i18n/translations";
import type { Language as LangType, Translations } from "@/lib/i18n/types";

export type Language = LangType;

// Backward compatibility - old translations dictionary for existing code
export const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    "nav.home": "Trang chủ",
    "nav.explore": "Khám phá",
    "nav.tours": "Tours",
    "nav.destinations": "Điểm đến",
    "nav.deals": "Ưu đãi",
    "nav.blog": "Bài viết",
    "nav.contact": "Liên hệ",
    "nav.assistance": "Chatbot Hỗ trợ",
    "nav.trips": "Chuyến đi",
    "nav.aiTrips": "Gợi ý lịch trình AI",
    "nav.login": "Đăng nhập",
    "nav.register": "Đăng ký",
    "nav.logout": "Đăng xuất",
    "nav.account": "Tài khoản",
    "nav.myTours": "Tour của tôi",
    "nav.wishlist": "Yêu thích",
    "nav.myOrders": "Đơn hàng của tôi",
    "nav.search": "Tìm kiếm tour...",
    "nav.bookNow": "Đặt tour ngay",
    "nav.member": "Thành viên",
    "nav.personalAccount": "Tài khoản cá nhân",
    "nav.bookedTours": "Tour đã đặt",
    "nav.menu": "Menu",

    // Settings
    "settings.theme": "Giao diện",
    "settings.language": "Ngôn ngữ",
    "settings.light": "Sáng",
    "settings.dark": "Tối",
    "settings.system": "Tự động",

    // Common
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
    "common.error": "Có lỗi xảy ra",
    "common.success": "Thành công",

    // Footer
    "footer.group11": "Nhóm 11",
    "footer.aboutUs": "Về chúng tôi",
    "footer.intro": "Giới thiệu",
    "footer.contactInfo": "Thông tin liên hệ",
    "footer.email": "Email",
    "footer.hotline": "Hotline",
    "footer.faq": "Hỏi đáp",
    "footer.connect": "Kết nối với chúng tôi",
    "footer.copyright": "Copyright @ 2025 | All Rights Reserved.",
  },
  en: {
    // Header
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.tours": "Tours",
    "nav.destinations": "Destinations",
    "nav.deals": "Deals",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.assistance": "Assistance",
    "nav.trips": "Trips",
    "nav.aiTrips": "AI Trip Suggestions",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.account": "Account",
    "nav.myTours": "My Tours",
    "nav.wishlist": "Wishlist",
    "nav.myOrders": "My Orders",
    "nav.search": "Search tours...",
    "nav.bookNow": "Book Now",
    "nav.member": "Member",
    "nav.personalAccount": "Personal Account",
    "nav.bookedTours": "Booked Tours",
    "nav.menu": "Menu",

    // Settings
    "settings.theme": "Theme",
    "settings.language": "Language",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.system": "System",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Success",

    // Footer
    "footer.group11": "Group 11",
    "footer.aboutUs": "About Us",
    "footer.intro": "Introduction",
    "footer.contactInfo": "Contact Information",
    "footer.email": "Email",
    "footer.hotline": "Hotline",
    "footer.faq": "FAQ",
    "footer.connect": "Connect With Us",
    "footer.copyright": "Copyright @ 2025 | All Rights Reserved.",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translationsData: Partial<Translations>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  setLanguage: () => { },
  t: (key: string) => key,
  translationsData: {},
  isLoading: true,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");
  const [translationsData, setTranslationsData] = useState<Partial<Translations>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslationsForLanguage = async () => {
      setIsLoading(true);
      try {
        const loadedTranslations = await loadAllTranslations(language);
        setTranslationsData(loadedTranslations);
      } catch (error) {
        console.error("Failed to load translations:", error);
        // Fallback to cached or empty
        setTranslationsData(getCachedTranslations(language));
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      loadTranslationsForLanguage();
    }
  }, [language, mounted]);

  // Initialize from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null;
    const browserLang = navigator.language.startsWith("vi") ? "vi" : "en";
    const initialLang = savedLang || browserLang;

    setLanguageState(initialLang);
    document.documentElement.setAttribute("lang", initialLang);
    setMounted(true);
  }, []);

  // Translation function - backward compatible with old dictionary
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // Set language function
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLang);
      document.documentElement.setAttribute("lang", newLang);
      window.dispatchEvent(
        new CustomEvent("languageChanged", { detail: newLang })
      );
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, translationsData, isLoading }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
