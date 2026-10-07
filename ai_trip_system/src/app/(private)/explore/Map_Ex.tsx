"use client";
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon issue in Leaflet when using with Webpack
const iconProto = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: () => string;
};
if (iconProto._getIconUrl) {
  delete iconProto._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Vietnam bounds for initial view
const VIETNAM_CENTER: [number, number] = [14.0583, 108.2772];
const VIETNAM_ZOOM = 6;

// Google Geocoding API types
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

// Custom user location icon
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

// Component để xử lý sự kiện click trên map
const MapClickHandler = ({
  onLocationClick,
}: {
  onLocationClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log("Clicked location:", lat, lng);
      onLocationClick(lat, lng);
    },
  });
  return null;
};

// Hàm để lấy tên tỉnh từ tọa độ sử dụng Google Maps Geocoding API
const getProvinceFromCoordinates = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("Missing Google Places API Key");
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=vi&result_type=administrative_area_level_1&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      // Kết quả đầu tiên thường là chính xác nhất cho cấp tỉnh/thành phố
      const addressComponents = data.results[0].address_components;

      // Tìm component có type là administrative_area_level_1 (Tỉnh/Thành phố)
      const provinceComponent = addressComponents.find((component: AddressComponent) =>
        component.types.includes("administrative_area_level_1")
      );

      if (provinceComponent) {
        console.log("Found province from Google:", provinceComponent.long_name);
        return provinceComponent.long_name;
      }
    }

    console.warn("No province found in Google Geocoding response:", data);
    return null;
  } catch (error) {
    console.error("Error getting province from Google:", error);
    return null;
  }
};

// Interface cho props của Map component
interface MapProps {
  onProvinceSelect?: (province: string) => void;
  className?: string;
}

export default function MapEx({ onProvinceSelect, className = "" }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [loading, setLoading] = useState(false);

  // Lấy vị trí hiện tại của người dùng
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          // Chỉ log lỗi có nghĩa, không log object rỗng
          if (error.code !== undefined) {
            console.warn("Geolocation error:", {
              code: error.code,
              message: error.message || "Không thể lấy vị trí người dùng"
            });
          }
          // Sử dụng vị trí mặc định là Việt Nam nếu không lấy được vị trí
          setUserLocation(VIETNAM_CENTER);
        },
        {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false
        }
      );
    } else {
      // Fallback nếu không có geolocation API
      setUserLocation(VIETNAM_CENTER);
    }
  }, []);

  const handleLocationClick = async (lat: number, lng: number) => {
    setLoading(true);
    setSelectedLocation([lat, lng]);

    try {
      const province = await getProvinceFromCoordinates(lat, lng);
      if (province && onProvinceSelect) {
        onProvinceSelect(province);
      } else {
        console.log("Could not identify province for coordinates:", lat, lng);
      }
    } catch (error) {
      console.error("Error handling location click:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Đang tìm địa điểm (Google Maps)...</span>
          </div>
        </div>
      )}

      <MapContainer
        center={VIETNAM_CENTER}
        zoom={VIETNAM_ZOOM}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Chỉ thêm MapClickHandler nếu có onProvinceSelect */}
        {onProvinceSelect && (
          <MapClickHandler onLocationClick={handleLocationClick} />
        )}

        {/* Marker cho vị trí người dùng */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}

        {/* Marker cho vị trí đã chọn */}
        {selectedLocation && (
          <Marker position={selectedLocation}>
            <Popup>Vị trí đã chọn</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
