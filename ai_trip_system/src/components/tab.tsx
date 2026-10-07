import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaStar, FaStarHalfStroke, FaRegStar } from "react-icons/fa6";
import ModalImage from "react-modal-image";
import dynamic from "next/dynamic";
import WeatherCard from "./weatherCard";

const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

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

type TabProp = {
  label: string;
  count?: number;
  content: React.ReactNode;
};

type TabProps = {
  activity: Activity;
  idPlace: string;
  placePhotos?: google.maps.places.PlacePhoto[];
};

type PlaceReviewResponse = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
};

interface PlaceImageBase {
  idplace: string;
  image: string;
}

interface PlaceImageResponse extends PlaceImageBase {
  idimage: string;
}

const Tab = ({ activity, idPlace, placePhotos = [] }: TabProps) => {
  console.log(idPlace);
  const [activeTab, setActiveTab] = useState<number>(0);
  const tabRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [reviews, setReviews] = useState<PlaceReviewResponse[]>([]);
  const [images, setImages] = useState<PlaceImageResponse[]>([]);
  const [underlineProps, setUnderlineProps] = useState<{
    width: number;
    left: number;
  }>({
    width: 0,
    left: 0,
  });
  const [googlePlaceImages, setGooglePlaceImages] = useState<string[]>([]);

  // Fetch images from Google Places photos instead of backend
  useEffect(() => {
    if (placePhotos && placePhotos.length > 0) {
      // Convert Google Place photos to URLs
      const photoUrls = placePhotos.map(photo => {
        if (typeof (photo as any).getURI === 'function') {
          return (photo as any).getURI({ maxWidth: 800, maxHeight: 600 });
        }
        if (typeof photo.getUrl === 'function') {
          return photo.getUrl({ maxWidth: 800, maxHeight: 600 });
        }
        return '';
      }).filter(url => url !== '');
      setGooglePlaceImages(photoUrls);
    } else {
      // Fallback: try to fetch from Google Places using activity data
      const fetchGooglePlaceImages = async () => {
        if (typeof window === "undefined" || !window.google?.maps) {
          console.warn("Google Maps not available");
          return;
        }

        try {
          const { Place } = (await google.maps.importLibrary(
            "places"
          )) as google.maps.PlacesLibrary;

          const query = `${activity.namePlace} ${activity.address}`;
          const { places } = await Place.searchByText({
            textQuery: query,
            fields: ['photos'],
            locationBias: activity.lat && activity.lon ?
              new google.maps.LatLng(activity.lat, activity.lon) : undefined,
            maxResultCount: 1,
          });

          if (places && places.length > 0 && places[0].photos) {
            const photoUrls = places[0].photos.slice(0, 10).map(photo =>
              photo.getURI({ maxWidth: 800, maxHeight: 600 })
            );
            setGooglePlaceImages(photoUrls);
          }
        } catch (error) {
          console.error("Error fetching Google Place images:", error);
        }
      };

      fetchGooglePlaceImages();
    }
  }, [placePhotos, activity]);

  // Keep the old images state for compatibility but populate from Google
  useEffect(() => {
    if (googlePlaceImages.length > 0) {
      const convertedImages: PlaceImageResponse[] = googlePlaceImages.map((url, idx) => ({
        idimage: `google-${idx}`,
        idplace: idPlace || `${activity.lat}-${activity.lon}`,
        image: url,
      }));
      setImages(convertedImages);
    }
  }, [googlePlaceImages, idPlace, activity]);

  // Fetch Google Places reviews using New API
  useEffect(() => {
    async function fetchGoogleReviews() {
      if (typeof window === "undefined" || !window.google?.maps) {
        console.warn("Google Maps not available for reviews");
        return;
      }

      try {
        const { Place } = (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const query = `${activity.namePlace} ${activity.address}`;
        const { places } = await Place.searchByText({
          textQuery: query,
          fields: ['reviews', 'rating', 'userRatingCount'],
          locationBias: activity.lat && activity.lon ?
            new google.maps.LatLng(activity.lat, activity.lon) : undefined,
          maxResultCount: 1,
        });

        if (places && places.length > 0 && places[0].reviews) {
          // Convert Google Reviews to our format
          const googleReviews: PlaceReviewResponse[] = places[0].reviews.map(review => ({
            author_name: review.authorAttribution?.displayName || 'Anonymous',
            rating: review.rating || 0,
            text: review.text || '',
            relative_time_description: review.relativePublishTimeDescription || '',
            profile_photo_url: review.authorAttribution?.photoURI || undefined,
          }));
          setReviews(googleReviews);
        }
      } catch (error) {
        console.error("Error fetching Google reviews:", error);
      }
    }

    fetchGoogleReviews();
  }, [activity.lat, activity.lon, activity.namePlace, activity.address]);

  const tabs: TabProp[] = [
    {
      label: "Thông tin",
      content: (
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-blue-700 flex items-center gap-2">
            📍 {activity.namePlace}
          </h2>

          <p className="text-gray-600 text-sm">
            🏙️ <span className="font-semibold">Thành phố:</span> {activity.city}
          </p>

          <p className="text-gray-600 text-sm">
            📬 <span className="font-semibold">Địa chỉ:</span>{" "}
            {activity.address}
          </p>

          <p className="text-gray-800 text-sm">
            📝 <span className="font-semibold">Mô tả:</span>{" "}
            {activity.description}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-500 text-lg">⭐</span>
            <span className="text-sm text-gray-700 font-medium">
              {activity.rating} / 5
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Đánh giá",
      count: reviews.length,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Đánh giá</h2>
          {reviews.length === 0 ? (
            <p>Địa điểm chưa có đánh giá nào</p>
          ) : (
            reviews.map((review, i) => (
              <div
                key={i}
                className="border-1 rounded-md p-5 bg-gray-100 shadow-md mb-5"
              >
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Image
                      src={review.profile_photo_url || "/profile.svg"}
                      alt="Avatar"
                      width={50}
                      height={50}
                      className="rounded-full"
                    />

                    <div>
                      <p className="font-bold">{review.author_name}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => {
                          const rating = review.rating ?? 0;
                          return i < Math.floor(rating) ? (
                            <FaStar key={i} className="text-yellow-500" />
                          ) : rating - i >= 0.5 ? (
                            <FaStarHalfStroke
                              key={i}
                              className="text-yellow-500"
                            />
                          ) : (
                            <FaRegStar key={i} className="text-yellow-500" />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p>{review.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      label: "Hình ảnh",
      count: images.length,
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Hình ảnh</h2>
          {images.length === 0 ? (
            <p className="text-gray-500">Chưa có hình ảnh nào</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative">
              {images.map((src, i) => (
                <ModalImage
                  key={i}
                  className="cursor-pointer rounded-lg"
                  alt={`${activity.namePlace} - ${i + 1}`}
                  small={src.image}
                  large={src.image}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Bản đồ",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Bản đồ</h2>
          <div className="space-y-4">
            <p className="text-gray-600">Xem vị trí trên Google Maps để thấy thông tin chi tiết, đánh giá, ảnh và chỉ đường.</p>
            <button
              onClick={() => {
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lon}`;
                window.open(googleMapsUrl, '_blank');
              }}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 font-semibold"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Mở trên Google Maps
            </button>
            <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200">
              <MapView
                locations={[{
                  name: activity.namePlace,
                  lat: activity.lat,
                  lon: activity.lon,
                }]}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Thời tiết",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Thời tiết</h2>
          <WeatherCard activity={activity} />
        </div>
      ),
    },
    {
      label: "Khác",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-4">Khác</h2>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const updateUnderline = () => {
      const tab = tabRef.current[activeTab];
      if (tab) {
        const { offsetWidth, offsetLeft } = tab;
        setUnderlineProps({
          width: offsetWidth,
          left: offsetLeft,
        });
      }
    };

    updateUnderline();
    window.addEventListener("resize", updateUnderline);
    return () => {
      window.removeEventListener("resize", updateUnderline);
    };
  }, [activeTab]);

  return (
    <div className="w-full">
      <div className="border-b relative flex">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => {
              tabRef.current[index] = el;
            }}
            className={`group relative flex-1 text-center py-3 text-sm font-medium transition-colors duration-300 ${index === activeTab
                ? "text-blue-600"
                : "text-gray-500 hover:text-blue-500"
              }`}
            onClick={() => setActiveTab(index)}
          >
            <div className="flex justify-center items-center gap-0.5 p-0.5 font-bold">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="inline-block bg-blue-100 text-blue-600 rounded-full px-2 py-0.5 text-xs ml-0.5">
                  {tab.count}
                </span>
              )}

              <span
                className={`absolute bottom-0 left-0 transform h-0.5 bg-blue-400 transition-transform duration-300 origin-left scale-x-0 w-full group-hover:scale-x-100 ${index === activeTab ? "hidden" : "block"
                  }`}
              />
            </div>
          </button>
        ))}

        <motion.div
          className="absolute bottom-0 h-1 bg-blue-500 rounded-t"
          animate={{
            width: underlineProps.width,
            left: underlineProps.left,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="p-5">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tab;
