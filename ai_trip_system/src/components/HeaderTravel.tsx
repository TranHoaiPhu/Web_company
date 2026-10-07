/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaSearch,
  FaHeart,
  FaUser,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaGlobeAsia,
  FaPlane,
  FaMountain,
  FaUmbrellaBeach,
  FaHome,
  FaMapMarkedAlt,
  FaTags,
  FaBlog,
  FaEnvelope,
  FaSignInAlt,
  FaUserPlus,
  FaTicketAlt,
  FaSignOutAlt,
  FaLifeRing,
} from "react-icons/fa";
import { tourCategoryService } from "@/services/tours/tour-categoy.service";
import { Category } from "@/types/backend";
import ThemeLanguageToggle from "./ThemeLanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import favoriteTourService from "@/services/tours/favorite-tour.service";

// Types
interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  submenu?: {
    label: string;
    href: string;
    icon: React.ReactNode;
    description?: string;
  }[];
}

interface TravelHeaderProps {
  isHomePage?: boolean;
}

const TravelHeader = ({ isHomePage = true }: TravelHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, logout, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log("DEBUG: HeaderTravel User object:", user);
    }
  }, [isLoggedIn, user]);

  const { resolvedTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  /// Get categories from backend (dummy data for now)

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await tourCategoryService.getAll();
        setCategories(fetchedCategories);
      } catch (error) {
        // Only log non-404 errors (API might not be deployed)
        const err = error as { status?: number };
        if (err.status !== 404) {
          console.error("Failed to fetch categories:", error);
        }
        // Silently set empty array for 404
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch real wishlist count
  useEffect(() => {
    const fetchWishlistCount = async () => {
      if (isLoggedIn) {
        try {
          const favorites = await favoriteTourService.getMyFavorites();
          setWishlistCount(favorites.length);
        } catch (error) {
          console.error("Error fetching wishlist count:", error);
        }
      } else {
        setWishlistCount(0);
      }
    };
    fetchWishlistCount();

    // Listen for favorite changes (custom event recommended)
    const handleFavoriteUpdate = () => fetchWishlistCount();
    window.addEventListener("favoriteChanged", handleFavoriteUpdate);
    return () => window.removeEventListener("favoriteChanged", handleFavoriteUpdate);
  }, [isLoggedIn]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    router.push("/");
  };

  // Check nếu là trang cần navbar trong suốt (trang chủ + trang detail tour/destination)
  const isTransparentPage = isHomePage ||
    pathname?.match(/^\/tours\/[^\/]+$/) ||
    pathname?.match(/^\/destinations\/[^\/]+$/);

  // Logic scroll:
  // - Trang trong suốt: false nếu ở 2 màn đầu (isScrolled=false), true nếu từ màn 3 (isScrolled=true)
  // - Trang khác: luôn true (luôn có nền)
  const effectiveScrolled = !isTransparentPage || isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      // If home page (intro), transparent for first 2 screens (3rd screen turns white)
      // For other transparent pages (like tour detail), turn white after small scroll
      const threshold = isHomePage ? window.innerHeight * 1.8 : 50;

      if (window.scrollY > threshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const menuItems: MenuItem[] = [

    ...(isLoggedIn
      ? [
        {
          label: t("nav.explore"),
          href: "/explore",
          icon: <FaMapMarkedAlt />,
        },
        {
          label: t("nav.aiTrips"),
          href: "/trips",
          icon: <FaPlane />,
        },
      ]
      : []),
    {
      label: t("nav.tours"),
      href: "/tours",
      icon: <FaPlane />,
      submenu: categories.map((category) => ({
        label: category.name,
        href: `/tours/category/${category.slug}`,
        icon: <FaGlobeAsia />,
      })),
    },
    {
      label: t("nav.destinations"),
      href: "/destinations",
      icon: <FaMapMarkedAlt />,
    },
    {
      label: t("nav.deals"),
      href: "/coupons",
      icon: <FaTags />,
    },
    {
      label: t("nav.blog"),
      href: "/blog",
      icon: <FaBlog />,
    },
    {
      label: t("nav.contact"),
      href: "/contact",
      icon: <FaEnvelope />,
    },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${effectiveScrolled
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg dark:shadow-slate-900/50 py-3"
          : "bg-transparent shadow-none py-4"
          }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-full overflow-hidden"
              >
                <Image
                  src="/logo/travelVN.png"
                  alt="TravelVN Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  priority
                />
              </motion.div>
              <div className="hidden sm:block">
                <h1
                  className={`text-xl font-bold transition-colors ${effectiveScrolled
                    ? "text-slate-900 dark:text-white"
                    : "text-white drop-shadow-md"
                    }`}
                >
                  TravelVN
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() =>
                    item.submenu && setActiveDropdown(item.label)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 font-medium text-sm transition-colors duration-200 ${effectiveScrolled
                      ? "text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                      : "text-white/90 hover:text-white drop-shadow-sm"
                      }`}
                  >
                    {item.label}
                    {item.submenu && (
                      <FaChevronDown
                        className={`text-xs transition-transform duration-300 ${activeDropdown === item.label ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </Link>

                  <AnimatePresence>
                    {item.submenu && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-xl dark:shadow-slate-900/50 overflow-hidden border border-white/80 dark:border-slate-700"
                      >
                        {item.submenu.map((subItem, index) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block"
                          >
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors first:rounded-t-xl last:rounded-b-xl group/item cursor-pointer"
                            >
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 group-hover/item:scale-110 transition-transform duration-200 text-sm">
                                {subItem.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400 transition-colors">
                                  {subItem.label}
                                </h3>
                                {subItem.description && (
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                                    {subItem.description}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Theme & Language Toggle */}
              <ThemeLanguageToggle isScrolled={effectiveScrolled} />

              {/* Wishlist */}
              {isLoggedIn && (
                <Link href="/profile?tab=favorites">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-all duration-200 relative ${effectiveScrolled
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                      : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                      }`}
                  >
                    <FaHeart className="text-base" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                  </motion.button>
                </Link>
              )}

              {/* User / Auth */}
              {isLoggedIn ? (
                <div
                  className="relative hidden md:block"
                  ref={profileDropdownRef}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg transition-colors duration-200 cursor-pointer text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name || "User"}
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-4 h-4" />
                      )}
                    </div>
                    <span className="truncate max-w-[80px]">
                      {user?.full_name || "User"}
                    </span>
                    <FaChevronDown
                      className={`text-xs transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 py-2 z-[100]"
                      >
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                            {user?.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={user.full_name || "User"}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUser className="w-6 h-6 text-blue-500" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {user?.full_name || t("nav.account")}
                            </span>
                            <span className="text-xs text-slate-500 truncate max-w-[140px]">
                              {user?.email}
                            </span>
                          </div>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaTicketAlt className="w-5 h-5 text-blue-400" />
                          <span>{t("nav.account")}</span>
                        </Link>

                        <Link
                          href="/assistance"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaLifeRing className="w-5 h-5 text-emerald-500" />
                          <span>{t("nav.assistance")}</span>
                        </Link>


                        {/*     <Link
                          href="/yourbooking"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaTicketAlt className="w-5 h-5 text-blue-400" />
                          <span>Tour của tôi</span>
                        </Link> */}
                        <Link
                          href="/wishlist"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaHeart className="w-5 h-5 text-pink-500" />
                          <span>{t("nav.wishlist")}</span>
                        </Link>


                        <Link
                          href="/order-history"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaTicketAlt className="w-5 h-5 text-blue-400" />
                          <span>{t("nav.myOrders")}</span>
                        </Link>

                        {/* Removed AI Trips from here as it's now in main header */}



                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors rounded-b-xl text-sm cursor-pointer border-t border-gray-100 dark:border-slate-700"
                        >
                          <FaSignOutAlt className="w-5 h-5 text-red-500" />
                          <span>{t("nav.logout")}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm ${effectiveScrolled
                        ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                        : "text-white hover:bg-white/20 border border-white/40"
                        }`}
                    >
                      {t("nav.login")}
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
                    >
                      {t("nav.register")}
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Toggle */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2.5 rounded-lg transition-all ${effectiveScrolled
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                  : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                  }`}
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header >

      {/* Mobile Menu - giữ nguyên code cũ */}
      <AnimatePresence>
        {
          isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl dark:shadow-slate-950/50 z-50 lg:hidden overflow-y-auto"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                      <Image
                        src="/logo/travelVN.png"
                        alt="TravelVN Logo"
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        TravelVN
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{t("nav.menu")}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="relative">
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder={t("nav.search")}
                      className="w-full pl-14 pr-5 py-3.5 rounded-full bg-gray-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 shadow-inner dark:shadow-slate-950/50"
                    />
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {item.submenu ? (
                        <>
                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === item.label ? null : item.label,
                              )
                            }
                            className="w-full flex items-center justify-between px-5 py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-800 dark:text-white font-semibold text-left"
                          >
                            <span className="flex items-center gap-4">
                              <span className="text-xl text-blue-600">
                                {item.icon}
                              </span>
                              {item.label}
                            </span>
                            <FaChevronDown
                              className={`text-sm transition-transform ${activeDropdown === item.label ? "rotate-180" : ""
                                }`}
                            />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === item.label && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pl-6 mt-1 space-y-1"
                              >
                                {item.submenu.map((sub) => (
                                  <Link
                                    key={sub.label}
                                    href={sub.href}
                                    className="flex items-center gap-4 px-5 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                  >
                                    <span className="text-lg text-blue-500">
                                      {sub.icon}
                                    </span>
                                    <span>{sub.label}</span>
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-800 dark:text-white font-semibold"
                        >
                          <span className="text-xl text-blue-600">
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white overflow-hidden">
                            {user?.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={user.full_name || "User"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUser className="text-xl" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {user?.full_name || "User"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                              {t("nav.member")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link href="/profile">
                        <button className="w-full px-6 py-4 rounded-xl font-semibold border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer">
                          {t("nav.personalAccount")}
                        </button>
                      </Link>
                      <Link href="/yourbooking">
                        <button className="w-full px-6 py-4 rounded-xl font-semibold border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer">
                          {t("nav.bookedTours")}
                        </button>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-6 py-4 rounded-xl font-bold border-2 border-red-500 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all cursor-pointer"
                      >
                        {t("nav.logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <button className="w-full px-6 py-4 rounded-xl font-bold border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-3 cursor-pointer">
                          <FaSignInAlt />
                          {t("nav.login")}
                        </button>
                      </Link>
                      <Link href="/register">
                        <button className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer">
                          <FaUserPlus />
                          {t("nav.register")}
                        </button>
                      </Link>
                    </>
                  )}
                  <Link href="/booking">
                    <button className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg transition-all">
                      {t("nav.bookNow")}
                    </button>
                  </Link>
                </div>
              </motion.div>
            </>
          )
        }
      </AnimatePresence >
    </>
  );
};

export default TravelHeader;
