import { useState, useRef, useEffect, useCallback } from "react";
import Tab from "./tab";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

interface Activity {
  time: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  namePlace: string;
  city: string;
  province?: string;
  address: string;
  rating: number;
}

type CarouselProps = {
  activities: Activity[];
};

const Carousel = ({ activities }: CarouselProps) => {
  const imageWidth = 300;
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [showInfo, setShowInfo] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const [activityImages, setActivityImages] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);
  const [idPlaceArray, setIdPlaceArray] = useState<string[]>([]);
  const [placePhotos, setPlacePhotos] = useState<google.maps.places.PlacePhoto[][]>([]);

  const getVisibleCount = () => {
    if (typeof window === "undefined") return 2;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 2;
  };
  const [visibleCount, setVisibleCount] = useState<number>(getVisibleCount());

  useEffect(() => {
    // Fetch images from Google Places New API for each activity
    const fetchGooglePlacesImages = async () => {
      const urls: string[] = [];
      const loading: boolean[] = [];
      const idplaces: string[] = [];
      const photos: google.maps.places.PlacePhoto[][] = [];

      // Check if Google Maps API is available
      if (typeof window === "undefined" || !window.google?.maps) {
        console.warn("Google Maps JS API not ready, using static maps");
        loadFallbackStaticMaps(urls, loading, idplaces);
        return;
      }

      try {
        // Load Places library
        const { Place } = (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        for (let i = 0; i < activities.length; i++) {
          loading[i] = true;
          const activity = activities[i];

          try {
            // Search for place using name and coordinates
            const query = `${activity.namePlace} ${activity.address}`;
            
            const { places } = await Place.searchByText({
              textQuery: query,
              fields: ['id', 'photos', 'displayName', 'formattedAddress', 'rating'],
              locationBias: activity.lat && activity.lon ? 
                new google.maps.LatLng(activity.lat, activity.lon) : undefined,
              maxResultCount: 1,
            });

            if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
              const photo = places[0].photos[0];
              const photoUrl = photo.getURI({ maxWidth: 600, maxHeight: 400 });
              urls[i] = photoUrl || "";
              idplaces[i] = places[0].id || "";
              photos[i] = (places[0].photos || []) as unknown as google.maps.places.PlacePhoto[];
              loading[i] = false;
            } else {
              // Fallback to static map if no photos
              urls[i] = getFallbackStaticMapUrl(activity);
              idplaces[i] = "";
              photos[i] = [];
              loading[i] = false;
            }
          } catch (error) {
            console.error(`Error fetching photo for ${activity.namePlace}:`, error);
            urls[i] = getFallbackStaticMapUrl(activity);
            idplaces[i] = "";
            photos[i] = [];
            loading[i] = false;
          }
        }

        setActivityImages(urls);
        setLoadingStates(loading);
        setIdPlaceArray(idplaces);
        setPlacePhotos(photos);
      } catch (error) {
        console.error("Error loading Google Places library:", error);
        loadFallbackStaticMaps(urls, loading, idplaces);
      }
    };

    const loadFallbackStaticMaps = (urls: string[], loading: boolean[], idplaces: string[]) => {
      for (let i = 0; i < activities.length; i++) {
        loading[i] = false;
        urls[i] = getFallbackStaticMapUrl(activities[i]);
        idplaces[i] = "";
      }
      setActivityImages(urls);
      setLoadingStates(loading);
      setIdPlaceArray(idplaces);
      setPlacePhotos([]);
    };

    const getFallbackStaticMapUrl = (activity: Activity): string => {
      const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      return `https://maps.googleapis.com/maps/api/staticmap?center=${activity.lat},${activity.lon}&zoom=16&size=600x400&markers=color:red%7C${activity.lat},${activity.lon}&maptype=roadmap&key=${GOOGLE_MAPS_API_KEY}`;
    };

    fetchGooglePlacesImages();
  }, [activities]);

  const maxIndex = Math.ceil(activityImages.length / visibleCount);

  const goto = useCallback(
    (newIndex: number) => {
      setSelectedIndex(newIndex * visibleCount);
    },
    [visibleCount]
  );

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.transform = `translateX(-${
        index * visibleCount * imageWidth
      }px)`;
    }
  }, [index, visibleCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > 50) goto(index - 1);
    else if (touchDeltaX.current < -50) goto(index + 1);
    touchDeltaX.current = 0;
  };

  const handleNext = () => {
    const next = selectedIndex + 1;
    setSelectedIndex(next >= activityImages.length ? 0 : next);
  };
  const handlePrev = () => {
    const prev = selectedIndex - 1;
    setSelectedIndex(prev < 0 ? activityImages.length - 1 : prev);
  };

  useEffect(() => {
    setIndex(Math.floor(selectedIndex / visibleCount));
  }, [selectedIndex, visibleCount]);

  const handleClickImage = (idx: number) => {
    if (selectedIndex === idx) setShowInfo((prev) => !prev);
    else {
      setSelectedIndex(idx);
      setShowInfo(true);
    }
    setHasVisited(true);
  };

  return (
    <>
      <div className="px-10 py-3 relative">
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={containerRef}
            className="flex gap-4 transition-transform duration-500 ease-in-out"
          >
            {activityImages.map((src, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-[300px] h-[200px] relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                  selectedIndex === i ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102'
                }`}
                onClick={() => handleClickImage(i)}
              >
                {loadingStates[i] || !src ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <img
                      src={src}
                      alt={activities[i].namePlace}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        selectedIndex === i
                          ? "opacity-100 brightness-100"
                          : "opacity-70 group-hover:opacity-90 brightness-90 group-hover:brightness-100"
                      }`}
                      loading="lazy"
                    />
                    {/* Overlay with click hint */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-4 transition-opacity duration-300 ${
                      selectedIndex === i ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className="text-white text-sm font-semibold flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Xem chi tiết
                      </div>
                    </div>
                    {/* Selected indicator */}
                    {selectedIndex === i && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        Đang xem
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {activityImages.length > visibleCount && (
          <>
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: maxIndex }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i * visibleCount)}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-colors duration-300 ${
                    i === index ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></button>
              ))}
            </div>

            <FaAngleLeft
              className="w-8 h-8 text-black bg-white/60 rounded-full absolute top-1/2 -translate-y-1/2 left-2 hover:bg-black/20 shadow-lg backdrop-blur-sm z-10 cursor-pointer"
              aria-hidden="true"
              onClick={handlePrev}
            />
            <FaAngleRight
              className="w-8 h-8 text-black bg-white/60 rounded-full absolute top-1/2 -translate-y-1/2 right-2 hover:bg-black/20 shadow-lg backdrop-blur-sm z-10 cursor-pointer"
              aria-hidden="true"
              onClick={handleNext}
            />
          </>
        )}
      </div>

      {hasVisited && (
        <div
          className={`p-4 bg-white rounded-xl shadow-lg transition-opacity duration-500 ${
            showInfo ? "opacity-100 block" : "opacity-0 hidden"
          }`}
        >
          <Tab
            activity={activities[selectedIndex]}
            idPlace={idPlaceArray[selectedIndex]}
            placePhotos={placePhotos[selectedIndex] || []}
          />
        </div>
      )}
    </>
  );
};

export default Carousel;
