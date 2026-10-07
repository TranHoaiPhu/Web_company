"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  FaSun,
  FaMoon,
  FaDesktop,
  FaGlobe,
  FaCheck,
  FaCog,
} from "react-icons/fa";

interface ThemeLanguageToggleProps {
  isScrolled?: boolean;
}

const ThemeLanguageToggle = ({ isScrolled = true }: ThemeLanguageToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const themeOptions = [
    { value: "light" as const, icon: <FaSun />, label: t("settings.light") },
    { value: "dark" as const, icon: <FaMoon />, label: t("settings.dark") },
    { value: "system" as const, icon: <FaDesktop />, label: t("settings.system") },
  ];

  const languageOptions = [
    { value: "vi" as const, flag: "🇻🇳", label: "Tiếng Việt" },
    { value: "en" as const, flag: "🇺🇸", label: "English" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
          isScrolled
            ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
            : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
        }`}
        aria-label="Settings"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaCog className="text-base" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-[100]"
          >
            {/* Theme Section */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  {resolvedTheme === "dark" ? (
                    <FaMoon className="text-white text-xs" />
                  ) : (
                    <FaSun className="text-white text-xs" />
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("settings.theme")}
                </span>
              </div>

              {/* Theme Toggle Pills */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                {themeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all duration-300 cursor-pointer ${
                      theme === option.value
                        ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <motion.span
                      initial={false}
                      animate={{
                        rotate: theme === option.value ? 360 : 0,
                        scale: theme === option.value ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {option.icon}
                    </motion.span>
                    <span className="hidden sm:inline">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Language Section */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <FaGlobe className="text-white text-xs" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("settings.language")}
                </span>
              </div>

              {/* Language Options */}
              <div className="space-y-1">
                {languageOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setLanguage(option.value)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      language === option.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{option.flag}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <AnimatePresence>
                      {language === option.value && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center"
                        >
                          <FaCheck className="text-white text-xs" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Visual Indicator */}
            <motion.div
              className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeLanguageToggle;
