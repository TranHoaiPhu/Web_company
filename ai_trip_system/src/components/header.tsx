// src/app/components/header.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import useSWR from "swr";
import { getCookie } from "cookies-next";
import { API_BASE_URL } from "@/config/api";
import { UserResponse } from "@/types/backend";

// Add custom styles for shimmer animation
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`;

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [, setActiveSection] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Use the auth context for login status
  const { isLoggedIn, logout } = useAuth();

  const userid = localStorage.getItem("current_user_id");
  const access_token = getCookie("token") || "";
  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

  const { data: userData } = useSWR<UserResponse>(
    `${API_BASE_URL}/users/idUser?lookup=${userid}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Helper function to check if a route is active
  // const isActiveRoute = (route: string) => {
  //   return pathname === route;
  // };

  // Handle navigation with loading state
  const handleNavigation = (route: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (pathname === route) return; // Don't navigate if already on the route

    setIsNavigating(true);
    setIsDropdownOpen(false);

    // Add a small delay for visual feedback
    setTimeout(() => {
      router.push(route);
      // Reset navigation state after a delay
      setTimeout(() => setIsNavigating(false), 500);
    }, 150);
  };

  // Set mounted state to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Close dropdown first if open
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }

    // Use setTimeout to ensure UI updates before logout processing
    setTimeout(() => {
      // Use the logout function from auth context
      logout();

      // Redirect to home page using router.replace to avoid adding to history
      router.replace("/");
    }, 10);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle scroll effect for header shadow and active section
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Header becomes solid only after scrolling past 2 full screens (video + slider sections)
      // This means from the 3rd section onwards - need to scroll past both video and slider
      if (scrollY > windowHeight * 2 - 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Update active section based on scroll position
      const aboutSection = document.getElementById("about");
      const featuresSection = document.getElementById("features");
      const membersSection = document.getElementById("members");
      const contactSection = document.getElementById("contact");

      const scrollPosition = scrollY + 100; // Add offset for header height

      if (aboutSection && featuresSection && membersSection && contactSection) {
        // Hide scroll indicator when we've scrolled deeper into the contact section
        if (scrollPosition >= contactSection.offsetTop + 300) {
          // Add 300px offset to hide it later
          setShowScrollIndicator(false);
        } else {
          setShowScrollIndicator(true);
        }

        // Update active section
        if (
          scrollPosition >= aboutSection.offsetTop &&
          scrollPosition < featuresSection.offsetTop
        ) {
          setActiveSection("about");
        } else if (
          scrollPosition >= featuresSection.offsetTop &&
          scrollPosition < membersSection.offsetTop
        ) {
          setActiveSection("features");
        } else if (
          scrollPosition >= membersSection.offsetTop &&
          scrollPosition < contactSection.offsetTop
        ) {
          setActiveSection("members");
        } else if (scrollPosition > contactSection.offsetTop) {
          setActiveSection("contact");
        } else {
          setActiveSection(null);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Call once on mount to set initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Inject custom styles */}
      <style jsx>{shimmerStyles}</style>

      {/* Scroll down indicator - only shows when not at footer and component is mounted */}
      {isMounted && showScrollIndicator && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FFD700"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      )}

      <header
        className={`flex items-center ${
          isLoggedIn ? "h-[53px]" : "h-[80px]"
        } fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isLoggedIn || scrolled || (pathname !== "/" && pathname !== "/intro")
            ? "bg-gradient-to-r from-[#000080] to-[#00BFFF] shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-b border-black/30"
            : "bg-transparent"
        } ${isNavigating ? "opacity-90" : ""}`}
      >
        {/* Navigation Loading Indicator */}
        {isNavigating && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] animate-pulse">
            <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>
        )}
        {/* Left side - Logo */}
        <div
          className={`flex justify-start items-center gap-3 ${
            isLoggedIn ? "px-6 w-auto" : "p-4 w-1/4"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              onClick={(e) => handleNavigation(isLoggedIn ? "/home" : "/", e)}
              className="cursor-pointer transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/logo/travelVN.png"
                width={isLoggedIn ? 150 : 200}
                height={isLoggedIn ? 45 : 60}
                alt="AI Travel Logo"
                className={`${
                  isLoggedIn ? "w-[150px] h-auto" : "w-[200px] h-auto"
                } object-contain`}
                priority
              />
            </div>
            <div
              onClick={(e) => handleNavigation(isLoggedIn ? "/home" : "/", e)}
              className="cursor-pointer"
            >
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                TravelVN
              </span>
            </div>
          </div>
          <div>
            <div
              onClick={(e) => handleNavigation(isLoggedIn ? "/home" : "/", e)}
              className="cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <span
                className={`text-[#FFD700] font-['PlaywriteDKLoopet'] tracking-wide ${
                  isLoggedIn ? "text-2xl" : "text-4xl"
                }`}
              >
                TravelVN
              </span>
            </div>
          </div>
        </div>

        {/* Center - Navigation */}
        <div className="flex justify-center items-center p-4 w-2/4">
          {/* Center menu items - only show when not logged in */}
          {!isLoggedIn && (
            <div className="hidden md:flex items-center justify-center mx-auto gap-10">
              <button
                onClick={(e) => handleNavigation("/about", e)}
                className="flex items-center no-underline transition-all duration-300"
                aria-label="Về chúng tôi"
              >
                <span
                  className={`text-lg font-medium ${
                    pathname === "/about"
                      ? "text-[#FFD700]"
                      : "text-white hover:opacity-70"
                  }`}
                >
                  Về chúng tôi
                </span>
              </button>

              <button
                onClick={(e) => handleNavigation("/intro", e)}
                className="flex items-center no-underline transition-all duration-300"
                aria-label="Tour"
              >
                <span
                  className={`text-lg font-medium ${
                    pathname === "/intro" || pathname === "/"
                      ? "text-[#FFD700]"
                      : "text-white hover:opacity-70"
                  }`}
                >
                  Tour
                </span>
              </button>

              <button
                onClick={(e) => handleNavigation("/blog", e)}
                className="flex items-center no-underline transition-all duration-300"
                aria-label="Blog"
              >
                <span
                  className={`text-lg font-medium ${
                    pathname === "/blog"
                      ? "text-[#FFD700]"
                      : "text-white hover:opacity-70"
                  }`}
                >
                  Blog
                </span>
              </button>

              <button
                onClick={(e) => handleNavigation("/contact", e)}
                className="flex items-center no-underline transition-all duration-300"
                aria-label="Liên hệ"
              >
                <span
                  className={`text-lg font-medium ${
                    pathname === "/contact"
                      ? "text-[#FFD700]"
                      : "text-white hover:opacity-70"
                  }`}
                >
                  Liên hệ
                </span>
              </button>
            </div>
          )}

          {/* No navigation menu for logged in users - handled by sidebar */}
        </div>

        {/* Right side - Buttons */}
        <div
          className={`flex justify-end items-center ${
            isLoggedIn ? "px-6" : "p-4 w-1/4"
          }`}
        >
          {/* Login/Signup buttons - only show when not logged in */}
          {!isLoggedIn && (
            <div className="hidden md:flex items-center gap-3">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/login");
                }}
                className="flex items-center no-underline text-black bg-[#FFD700] border-2 border-transparent rounded-full px-5 py-2 cursor-pointer transition-all duration-300 hover:bg-white hover:border-[#FFD700]"
                aria-label="Đăng nhập"
              >
                <span className="text-base font-medium">Đăng nhập</span>
              </div>

              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/register");
                }}
                className="flex items-center no-underline text-black bg-[#FFD700] border-2 border-transparent rounded-full px-5 py-2 cursor-pointer transition-all duration-300 hover:bg-white hover:border-[#FFD700]"
                aria-label="Đăng ký"
              >
                <span className="text-base font-medium">Đăng ký</span>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div
            className="md:hidden relative inline-block ml-auto"
            ref={dropdownRef}
          >
            <div
              className="flex items-center text-white hover:opacity-70 transition-opacity duration-300"
              onClick={toggleDropdown}
              role="button"
              aria-expanded={isDropdownOpen}
              aria-label="Menu"
            >
              <Image
                src="/images/hamburger.svg"
                width={28}
                height={28}
                alt="menu"
              />
            </div>
            <div
              className={`absolute ${
                isLoggedIn ? "top-[53px]" : "top-[80px]"
              } right-0 bg-white min-w-[200px] shadow-lg rounded-md z-50 opacity-0 transition-all duration-300 transform -translate-y-2 ${
                isDropdownOpen ? "block opacity-100 translate-y-0" : "hidden"
              }`}
            >
              <div className="flex flex-col md:hidden">
                {/* Menu items for non-logged in users */}
                {!isLoggedIn && (
                  <>
                    <button
                      className={`flex items-center p-3 no-underline w-full text-left transition-all duration-300 ${
                        pathname === "/about"
                          ? "bg-[#FFD700] text-black"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleNavigation("/about", e);
                      }}
                    >
                      Về chúng tôi
                    </button>
                    <button
                      className={`flex items-center p-3 no-underline w-full text-left transition-all duration-300 ${
                        pathname === "/intro" || pathname === "/"
                          ? "bg-[#FFD700] text-black"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleNavigation("/intro", e);
                      }}
                    >
                      Tour
                    </button>
                    <button
                      className={`flex items-center p-3 no-underline w-full text-left transition-all duration-300 ${
                        pathname === "/blog"
                          ? "bg-[#FFD700] text-black"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleNavigation("/blog", e);
                      }}
                    >
                      Blog
                    </button>
                    <button
                      className={`flex items-center p-3 no-underline w-full text-left transition-all duration-300 ${
                        pathname === "/contact"
                          ? "bg-[#FFD700] text-black"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={(e) => {
                        setIsDropdownOpen(false);
                        handleNavigation("/contact", e);
                      }}
                    >
                      Liên hệ
                    </button>

                    <Link
                      href="/login"
                      key="mobile-login"
                      className="flex items-center text-black p-3 no-underline bg-[#FFD700] hover:bg-white hover:border-[#FFD700] hover:border-2 w-full text-left transition-all duration-300"
                      onClick={() => {
                        // Close dropdown first
                        setIsDropdownOpen(false);
                      }}
                      prefetch={false}
                    >
                      Đăng nhập
                    </Link>

                    <Link
                      href="/register"
                      key="mobile-signup"
                      className="flex items-center text-black p-3 no-underline bg-[#FFD700] hover:bg-white hover:border-[#FFD700] hover:border-2 w-full text-left transition-all duration-300"
                      onClick={() => {
                        // Close dropdown first
                        setIsDropdownOpen(false);
                      }}
                      prefetch={false}
                    >
                      Đăng ký
                    </Link>
                  </>
                )}

                {/* No navigation menu for logged in users - handled by sidebar */}

                {isLoggedIn && (
                  <Link
                    href={`/profile/${userid}`}
                    key="mobile-profile"
                    className="flex items-center text-black p-3 no-underline hover:bg-gray-200 w-full text-left"
                    onClick={() => setIsDropdownOpen(false)}
                    prefetch={false}
                  >
                    <div className="w-6 h-6 mr-2 relative">
                      <Image
                        src={
                          userData?.avatar
                            ? `${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(
                                userData.avatar
                              )}`
                            : "profile.svg"
                        }
                        fill
                        className="rounded-full object-cover"
                        alt="profile"
                      />
                    </div>
                    Profile
                  </Link>
                )}

                {/* Logout button for mobile menu if logged in */}
                {isLoggedIn && (
                  <div
                    className="flex items-center text-black p-3 no-underline hover:bg-gray-200 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      // Close dropdown first
                      setIsDropdownOpen(false);
                      // Use setTimeout to ensure dropdown closes before logout
                      setTimeout(() => {
                        handleLogout();
                      }, 50);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mr-2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Log out
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
