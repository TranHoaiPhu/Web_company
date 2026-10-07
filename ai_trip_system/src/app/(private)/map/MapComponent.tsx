"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  Ref,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FaMapMarkerAlt, FaLocationArrow, FaTimes } from "react-icons/fa";
import useSWR from "swr";
import DetailedMapPlaceCard from "./DetailedMapPlaceCard";
import Legend, { legendItems } from "./Legend";
import { renderToStaticMarkup } from "react-dom/server";
import { getCookie } from "cookies-next";
import PlaceImage from "@/components/PlaceImage";
import { API_BASE_URL } from "@/config/api";
import type { PlaceResponse } from "@/types/backend";
import { useTranslation } from "@/lib/i18n/hooks";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const VIETNAM_CENTER: [number, number] = [14.0583, 108.2772];
const VIETNAM_ZOOM = 6;
const MIN_ZOOM_TO_SHOW_MARKERS = 10;

const userLocationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const getPlaceIcon = (type: number | null, isSelected = false) => {
  const item =
    legendItems.find((it) => it.type === type) ??
    legendItems.find((it) => it.type === null)!;
  const fillColor = isSelected ? "#00FF00" : item.color;
  const IconComp = item.icon;

  const iconMarkup = renderToStaticMarkup(
    <IconComp
      style={{
        color: "white",
        width: "16px",
        height: "16px",
        display: "block",
        margin: "auto",
      }}
    />
  );

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="${fillColor}"/>
      <g transform="translate(4, 4)" style="transform-origin: center; width: 16px; height: 16px;">
        ${iconMarkup}
      </g>
    </svg>
  `;

  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svgString),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const MapUpdater = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const map = useMap();
  const prevCenterRef = useRef(center);
  const prevZoomRef = useRef(zoom);

  useEffect(() => {
    if (
      center[0] !== prevCenterRef.current[0] ||
      center[1] !== prevCenterRef.current[1] ||
      zoom !== prevZoomRef.current
    ) {
      map.setView(center, zoom);
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [map, center, zoom]);

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
};

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface MapProps {
  searchQuery?: string;
  onSelectPlace?: (place: PlaceResponse) => void;
  onPlacesLoaded?: (places: PlaceResponse[]) => void;
  updateSearchQuery?: (name: string) => void;
}

const MapClickHandler = ({
  updateMapState,
}: {
  onMarkerClick: (place: PlaceResponse) => void;
  updateMapState: (center: [number, number], zoom: number) => void;
}) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      updateMapState([center.lat, center.lng], zoom);
    },
  });

  return null;
};

const MapComponent = forwardRef(
  (
    { onSelectPlace, onPlacesLoaded, updateSearchQuery }: MapProps,
    ref: Ref<{
      handleMarkerClick: (place: PlaceResponse) => void;
      updateMapState: (center: [number, number], zoom: number) => void;
    }>
  ) => {
    const { t: tErrors } = useTranslation("errors");
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [, setLocationPermission] = useState<"prompt" | "granted" | "denied">(
      "prompt"
    );
    const [mapCenter, setMapCenter] =
      useState<[number, number]>(VIETNAM_CENTER);
    const [mapZoom, setMapZoom] = useState(VIETNAM_ZOOM);
    const [isLocating, setIsLocating] = useState(false);
    const [places, setPlaces] = useState<PlaceResponse[]>([]);
    const [showPlaces, setShowPlaces] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<PlaceResponse | null>(
      null
    );
    const [toast, setToast] = useState({
      visible: false,
      message: "",
      type: "success" as "success" | "error" | "info",
    });
    const mapRef = useRef<L.Map | null>(null);
    const [visiblePlaces, setVisiblePlaces] = useState<PlaceResponse[]>([]);

    const token = getCookie("token") as string;

    const fetcher = async (url: string) => {
      if (!token) throw new Error("No authorization token found");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch places");
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    };

    const fetchAllPlaces = async () => {
      let allPlaces: PlaceResponse[] = [];
      let skip = 0;
      const limit = 5000;

      while (true) {
        const response = await fetcher(
          `${API_BASE_URL}/places/all?skip=${skip}&limit=${limit}`
        );
        const placesPage: PlaceResponse[] = response;
        allPlaces = [...allPlaces, ...placesPage];

        if (placesPage.length < limit) {
          break;
        }
        skip += limit;
      }

      return allPlaces;
    };

    const {
      data: initialPlaces,
      error: initialError,
      isLoading: initialLoading,
    } = useSWR<PlaceResponse[]>(
      `${API_BASE_URL}/places/all`,
      fetchAllPlaces,
      { refreshInterval: 30000 }
    );

    useEffect(() => {
      if (initialPlaces && initialPlaces.length > 0) {
        setPlaces(initialPlaces);
        if (!userLocation && !selectedPlace && mapCenter === VIETNAM_CENTER) {
          setMapCenter([initialPlaces[0].lat, initialPlaces[0].lon]);
          setMapZoom(6);
        }
        if (onPlacesLoaded) onPlacesLoaded(initialPlaces);
      }
    }, [initialPlaces, onPlacesLoaded, userLocation, selectedPlace, mapCenter]);

    const checkLocationPermission = async () => {
      if (!navigator.permissions) {
        requestLocation();
        return;
      }
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "prompt") requestLocation();
        else if (permission.state === "granted") requestLocation();
        else {
          setLocationPermission("denied");
          showToast(
            tErrors("permission.locationDenied"),
            "error"
          );
        }
      } catch {
        requestLocation();
      }
    };

    const requestLocation = async () => {
      if (!navigator.geolocation) {
        alert("Trình duyệt của bạn không hỗ trợ định vị.");
        setLocationPermission("denied");
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
          setLocationPermission("granted");
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission("denied");
          setIsLocating(false);
          let errorMessage = tErrors("permission.locationFailed");
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = tErrors("permission.locationDeniedByUser");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Thông tin vị trí không khả dụng.";
              break;
            case error.TIMEOUT:
              errorMessage = "Yêu cầu vị trí đã hết thời gian.";
              break;
          }
          showToast(errorMessage, "error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    const handleMarkerClick = (place: PlaceResponse) => {
      setSelectedPlace(place);
      setMapCenter([place.lat, place.lon]);
      setMapZoom(15);
      setShowPlaces(true);
      if (onSelectPlace) onSelectPlace(place);
      if (updateSearchQuery) {
        updateSearchQuery(place.name);
      }
      if (mapRef.current && mapZoom >= MIN_ZOOM_TO_SHOW_MARKERS) {
        setTimeout(() => {
          const map = mapRef.current!;
          const bounds = map.getBounds();
          const newVisiblePlaces = places.filter((p) =>
            bounds.contains([p.lat, p.lon])
          );
          setVisiblePlaces(newVisiblePlaces);
        }, 100);
      }
    };

    const showToast = (message: string, type: "success" | "error" | "info") => {
      setToast({ visible: true, message, type });
      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 5000);
    };

    const updateMapState = useCallback(
      (center: [number, number], zoom: number) => {
        setMapCenter(center);
        setMapZoom(zoom);
        if (mapRef.current && zoom >= MIN_ZOOM_TO_SHOW_MARKERS) {
          const bounds = mapRef.current.getBounds();
          const newVisiblePlaces = places.filter((p) =>
            bounds.contains([p.lat, p.lon])
          );
          setVisiblePlaces(newVisiblePlaces);
        } else {
          setVisiblePlaces([]);
        }
      },
      [places]
    );

    useImperativeHandle(ref, () => ({
      handleMarkerClick,
      updateMapState,
    }));

    useEffect(() => {
      const handleResize = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
      if (mapRef.current && mapZoom >= MIN_ZOOM_TO_SHOW_MARKERS) {
        const bounds = mapRef.current.getBounds();
        const newVisiblePlaces = places.filter((p) =>
          bounds.contains([p.lat, p.lon])
        );
        setVisiblePlaces(newVisiblePlaces);
      } else {
        setVisiblePlaces([]);
      }
    }, [mapCenter, mapZoom, places]);

    if (initialLoading)
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
          Đang tải dữ liệu...
        </div>
      );
    if (initialError)
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
          Lỗi: {initialError.message}
        </div>
      );

    return (
      <div className="relative w-full h-full flex flex-col lg:flex-row">
        <div
          className={`w-full ${
            showPlaces && selectedPlace ? "lg:w-2/3" : "lg:w-full"
          } h-full relative`}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", margin: 0, padding: 0 }}
            className="z-0"
            ref={mapRef}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapClickHandler
              onMarkerClick={handleMarkerClick}
              updateMapState={updateMapState}
            />
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="text-center">
                    <FaMapMarkerAlt className="text-blue-500 mx-auto mb-1" />
                    <div className="font-semibold text-sm">Vị trí của bạn</div>
                    {userLocation.accuracy && (
                      <div className="text-xs text-gray-600">
                        Độ chính xác: ~{Math.round(userLocation.accuracy)}m
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            {visiblePlaces.length > 0 &&
              visiblePlaces.map((place) => (
                <Marker
                  key={place.idplace}
                  position={[place.lat, place.lon]}
                  icon={getPlaceIcon(
                    place.type,
                    selectedPlace?.idplace === place.idplace
                  )}
                  eventHandlers={{
                    click: () => handleMarkerClick(place),
                    mouseover: (e) => e.target.openPopup(),
                    mouseout: (e) => e.target.closePopup(),
                  }}
                >
                  <Popup
                    autoClose={false}
                    closeOnClick={false}
                    className="custom-popup max-w-xs p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <PlaceImage
                          idPlace={place.idplace}
                          altText={place.name}
                        />
                      </div>

                      <div className="flex flex-col justify-center">
                        <span className="text-sm font-medium">
                          {place.name}
                        </span>
                        <span className="text-xs text-yellow-500">
                          ⭐ {place.rating || "Chưa có đánh giá"}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
          <Legend />
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1001]">
            <button
              onClick={checkLocationPermission}
              disabled={isLocating}
              className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 disabled:opacity-50 ${
                userLocation
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600"
              }`}
              title={
                isLocating
                  ? "Đang lấy vị trí..."
                  : userLocation
                  ? "Cập nhật vị trí"
                  : "Chia sẻ vị trí của bạn"
              }
            >
              {isLocating ? (
                <div
                  className={`w-4 h-4 border ${
                    userLocation
                      ? "border-white border-t-transparent"
                      : "border-gray-600 border-t-transparent"
                  } rounded-full animate-spin`}
                ></div>
              ) : (
                <FaLocationArrow className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setMapCenter(VIETNAM_CENTER);
                setMapZoom(VIETNAM_ZOOM);
                setShowPlaces(false);
                setSelectedPlace(null);
              }}
              className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
              title="Xem toàn bộ Việt Nam"
            >
              <FaMapMarkerAlt className="text-gray-600 w-4 h-4" />
            </button>
            {showPlaces && (
              <button
                onClick={() => {
                  setShowPlaces(false);
                  setSelectedPlace(null);
                }}
                className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                title="Hủy chọn"
              >
                <FaTimes className="text-gray-600 w-4 h-4" />
              </button>
            )}
          </div>
          {userLocation && (
            <div className="absolute bottom-20 left-4 bg-white p-3 rounded-lg shadow-md border border-gray-200 z-[1001]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                <span className="text-xs text-gray-700">Vị trí của bạn</span>
              </div>
            </div>
          )}
        </div>
        {showPlaces && selectedPlace && (
          <div className="w-full lg:w-1/3 h-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chi tiết địa điểm</h2>
              <FaTimes
                onClick={() => {
                  setShowPlaces(false);
                  setSelectedPlace(null);
                }}
                className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-800"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DetailedMapPlaceCard place={selectedPlace} token={token || ""} />
            </div>
          </div>
        )}
        {toast.visible && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-md shadow-lg text-white z-[1002] ${
              toast.type === "success"
                ? "bg-green-500"
                : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }
);
MapComponent.displayName = "MapComponent";

const Map = forwardRef(
  (
    props: MapProps,
    ref: Ref<{
      handleMarkerClick: (place: PlaceResponse) => void;
      updateMapState: (center: [number, number], zoom: number) => void;
    }>
  ) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    if (!isMounted) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">Đang tải bản đồ...</div>
        </div>
      );
    }

    return <MapComponent {...props} ref={ref} />;
  }
);

Map.displayName = "Map";

export default Map;
