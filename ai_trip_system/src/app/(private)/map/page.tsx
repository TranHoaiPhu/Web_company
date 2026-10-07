"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaSearch,
  FaUtensils,
  FaHotel,
  FaLandmark,
  FaBars,
} from "react-icons/fa";
import Map from "./MapComponent";
import { API_BASE_URL } from "@/config/api";
import PlaceImage from "@/components/PlaceImage";
import { useTranslation } from "@/lib/i18n/hooks";
import type { PlaceResponse } from "@/types/backend";

export default function MapPage() {
  const { t } = useTranslation("map");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceResponse[]>([]);
  const [places, setPlaces] = useState<PlaceResponse[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTypeFilterActive, setIsTypeFilterActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const removeDiacritics = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const getCachedPlaces = (): PlaceResponse[] => {
    const cached = sessionStorage.getItem("selectedPlaces");
    return cached ? JSON.parse(cached) : [];
  };

  const cachePlace = (place: PlaceResponse) => {
    const cachedPlaces = getCachedPlaces();
    const existingIndex = cachedPlaces.findIndex(
      (p) => p.idplace === place.idplace
    );
    if (existingIndex !== -1) {
      cachedPlaces.splice(existingIndex, 1);
      cachedPlaces.unshift(place);
    } else {
      cachedPlaces.unshift(place);
      if (cachedPlaces.length > 15) {
        cachedPlaces.pop();
      }
    }
    sessionStorage.setItem("selectedPlaces", JSON.stringify(cachedPlaces));
  };

  const fetchAllPlaces = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/places/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch all places");
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error("Error fetching all places:", error);
      return [];
    }
  };

  const getPlacesByType = (
    type: number,
    allPlaces: PlaceResponse[]
  ): PlaceResponse[] => {
    const filteredPlaces = allPlaces.filter((place) => place.type === type);
    const shuffled = filteredPlaces.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 15);
  };

  useEffect(() => {
    const fetchInitialPlaces = async () => {
      const loadedPlaces = await fetchAllPlaces();
      setPlaces(loadedPlaces);
    };
    fetchInitialPlaces();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
      setShowSuggestions(true);
      if (searchQuery.trim() === "" && !isTypeFilterActive) {
        const cachedPlaces = getCachedPlaces();
        setSuggestions(
          cachedPlaces.length > 0 ? cachedPlaces : places.slice(0, 15)
        );
      }
    }
  }, [isTypeFilterActive, places, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        menuRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node) &&
        showSuggestions
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
        setIsTypeFilterActive(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showSuggestions]);

  const updateSuggestions = useCallback(
    (query: string, isTypeFilter: boolean = false) => {
      const typeKeywords = ["Nhà hàng", "Khách sạn", "Điểm du lịch"];
      if (query.trim() === "" && !isTypeFilter) {
        const cachedPlaces = getCachedPlaces();
        setSuggestions(
          cachedPlaces.length > 0 && isFocused
            ? cachedPlaces
            : isFocused
            ? places.slice(0, 15)
            : []
        );
      } else if (isTypeFilter || typeKeywords.includes(query)) {
        const typeMap: { [key: string]: number } = {
          "Nhà hàng": 0,
          "Khách sạn": 1,
          "Điểm du lịch": 2,
        };
        const type = typeMap[query] ?? null;
        setSuggestions(type !== null ? getPlacesByType(type, places) : []);
      } else {
        const filteredSuggestions = places
          .filter(
            (place) =>
              removeDiacritics(place.name.toLowerCase()).includes(
                removeDiacritics(query.toLowerCase())
              ) ||
              removeDiacritics(place.address.toLowerCase()).includes(
                removeDiacritics(query.toLowerCase())
              )
          )
          .slice(0, 15);
        setSuggestions(filteredSuggestions);
      }
    },
    [places, isFocused]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(true);
    setIsTypeFilterActive(false);
    updateSuggestions(query);
  };

  const handleSelectSuggestion = (place: PlaceResponse) => {
    cachePlace(place);
    setSearchQuery(place.name);
    setSuggestions([]);
    setIsFocused(false);
    setShowSuggestions(false);
    setIsTypeFilterActive(false);
    if (mapRef.current) mapRef.current.handleMarkerClick(place);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleTypeFilter = (type: number, label: string) => {
    setSearchQuery(label);
    setShowSuggestions(true);
    setIsTypeFilterActive(true);
    updateSuggestions(label, true);
  };

  const mapRef = useRef<{
    handleMarkerClick: (place: PlaceResponse) => void;
    updateMapState: (center: [number, number], zoom: number) => void;
    updateSearchQuery?: (name: string) => void;
  }>(null);

  const handlePlacesLoaded = useCallback(
    (loadedPlaces: PlaceResponse[]) => {
      setPlaces(loadedPlaces);
      if (isFocused && searchQuery === "" && !isTypeFilterActive) {
        const cachedPlaces = getCachedPlaces();
        setSuggestions(
          cachedPlaces.length > 0 ? cachedPlaces : loadedPlaces.slice(0, 15)
        );
        setShowSuggestions(true);
      }
    },
    [isFocused, isTypeFilterActive, searchQuery]
  );

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    if (searchQuery.trim() === "" && !isTypeFilterActive) {
      const cachedPlaces = getCachedPlaces();
      setSuggestions(
        cachedPlaces.length > 0 ? cachedPlaces : places.slice(0, 15)
      );
    } else {
      updateSuggestions(searchQuery, isTypeFilterActive);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!showSuggestions) setIsFocused(false);
    }, 100);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow w-full px-0">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 mt-4 px-6">
          {t("title")}
        </h1>
        <div className="w-full px-6">
          <div
            className="bg-white rounded-lg p-2 shadow-sm flex flex-col gap-2"
            ref={menuRef}
          >
            <div className="flex flex-col gap-2">
              <div className="md:hidden flex items-center justify-between">
                <form className="relative flex-grow" onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={t("search.mapPlaceholder")}
                    className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearch(searchQuery)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                  >
                    <FaSearch className="w-5 h-5" />
                  </button>
                </form>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none"
                >
                  <FaBars className="w-6 h-6" />
                </button>
              </div>

              <div
                className={`${
                  isMenuOpen ? "flex" : "hidden"
                } md:flex flex-col md:flex-row gap-2`}
              >
                <div className="flex-grow">
                  <form className="relative w-full" onSubmit={handleSubmit}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder={t("search.mapPlaceholder")}
                      className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 hidden md:block"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearch(searchQuery)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 hidden md:block"
                    >
                      <FaSearch className="w-5 h-5" />
                    </button>
                  </form>
                </div>
                <button
                  onClick={() => handleTypeFilter(0, t("placeTypes.restaurant"))}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
                >
                  <FaUtensils /> {t("placeTypes.restaurant")}
                </button>
                <button
                  onClick={() => handleTypeFilter(1, t("placeTypes.hotel"))}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 text-sm"
                >
                  <FaHotel /> {t("placeTypes.hotel")}
                </button>
                <button
                  onClick={() => handleTypeFilter(2, t("placeTypes.attraction"))}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm"
                >
                  <FaLandmark /> {t("placeTypes.attraction")}
                </button>
              </div>

              {(showSuggestions || isTypeFilterActive) && (
                <div className="bg-white border border-gray-300 rounded-lg shadow-md max-h-60 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map(
                      (place) => (
                        console.log("Suggestion:", place),
                        (
                          <div
                            key={place.idplace}
                            onClick={() => handleSelectSuggestion(place)}
                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 relative h-30"
                          >
                            <div className="relative w-40 h-full flex-shrink-0">
                              <PlaceImage
                                idPlace={place.idplace}
                                altText={place.name}
                              />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div>
                                <p className="text-sm font-medium">
                                  {place.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {place.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    )
                  ) : (
                    <div className="p-2 text-gray-500">
                      {t("search.noResults")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full mt-4 px-6 pb-3">
          <div className="w-full h-[600px] bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <Map
              ref={mapRef}
              searchQuery={searchQuery}
              onSelectPlace={(place: PlaceResponse) =>
                mapRef.current?.handleMarkerClick(place)
              }
              onPlacesLoaded={handlePlacesLoaded}
              updateSearchQuery={(name: string) => setSearchQuery(name)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
