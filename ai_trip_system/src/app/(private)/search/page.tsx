"use client";
import { useState } from "react";
import useSWR from "swr";
import { getCookie } from "cookies-next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { useTranslation } from "@/lib/i18n/hooks";

export default function ExplorePage() {
  const { t } = useTranslation("explore");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const currentUserID = localStorage.getItem("current_user_id");

  const access_token = getCookie("token") || "";
  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

  type User = {
    iduser: string;
    username: string;
    avatar?: string;
    // Add other fields as needed
  };

  const { data: usersData } = useSWR<User[]>(
    `${API_BASE_URL}/users/all`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const filteredUsers =
    searchQuery.trim() === ""
      ? []
      : Array.isArray(usersData)
      ? usersData
          .filter(
            (user: User) =>
              user.iduser !== currentUserID &&
              (user.username || "")
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  return (
    <div className="min-h-screen p-4 relative">
      {/* Search Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder={t("search.userPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-10 pr-4 py-3 text-base text-gray-900 bg-gray-100 rounded-full focus:outline-none"
        />
      </div>

      {/* Dropdown results */}
      {isFocused && filteredUsers.length > 0 && (
        <div className="mt-2 bg-white rounded-md shadow-md z-50 max-h-100 overflow-y-auto">
          {filteredUsers.map((user: User) => (
            <div
              key={user.username}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                router.push(`/profile/${user.iduser}`);
                setSearchQuery("");
              }}
            >
              <div className="w-8 h-8 relative">
                <Image
                  src={
                    user?.avatar
                      ? `${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(
                          user.avatar
                        )}`
                      : "/images/profile.svg"
                  }
                  fill
                  className="rounded-full object-cover"
                  alt="profile"
                />
              </div>
              <span className="text-base font-medium text-gray-800">
                {user.username}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
