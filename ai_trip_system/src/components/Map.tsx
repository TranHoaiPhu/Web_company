"use client";
import { useState, useEffect, useRef } from "react";
import { FaLocationArrow, FaGlobeAmericas, FaTrash, FaImages, FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from "react-icons/fa";
import Image from "next/image";

export interface LocationItem {
  name: string;
  lat: number;
  lon: number;
  description?: string;
  image?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface LeafletMapProps {
  locations?: LocationItem[];
  onClearLocations?: () => void;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

const LeafletMap = ({ locations = [], onClearLocations }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(true);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [locationImages, setLocationImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Calculate map center based on locations
  const getMapCenter = (): [number, number] => {
    if (locations.length === 0) return [16.0, 106.0];
    if (locations.length === 1) return [locations[0].lat, locations[0].lon];

    const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const avgLon = locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length;
    return [avgLat, avgLon];
  };

  const getZoomLevel = (): number => {
    if (locations.length === 0) return 6;
    if (locations.length === 1) return 12;

    const lats = locations.map(l => l.lat);
    const lons = locations.map(l => l.lon);
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lonDiff = Math.max(...lons) - Math.min(...lons);
    const maxDiff = Math.max(latDiff, lonDiff);

    if (maxDiff > 5) return 7;
    if (maxDiff > 2) return 9;
    if (maxDiff > 1) return 10;
    return 11;
  };

  const getStaticMapUrl = (): string => {
    const center = getMapCenter();
    const zoom = getZoomLevel();
    const size = "800x600";

    let markers = "";
    if (locations.length > 0) {
      markers = locations
        .slice(0, 10)
        .map((loc, i) => `markers=color:blue%7Clabel:${i + 1}%7C${loc.lat},${loc.lon}`)
        .join("&");
    }

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center[0]},${center[1]}&zoom=${zoom}&size=${size}&maptype=roadmap&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  // Fetch images from Google Places API
  useEffect(() => {
    const fetchGooglePlaceImages = async () => {
      if (locations.length === 0 || typeof window === "undefined" || !window.google?.maps) {
        return;
      }

      setLoadingImages(true);
      const images: Record<string, string> = {};

      try {
        const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

        for (const location of locations) {
          try {
            const { places } = await Place.searchByText({
              textQuery: `${location.name}, Vietnam`,
              fields: ['photos'],
              locationBias: new google.maps.LatLng(location.lat, location.lon),
              maxResultCount: 1,
            });

            if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
              const photo = places[0].photos[0];
              const url = photo.getURI({ maxWidth: 600, maxHeight: 400 });
              images[location.name] = url || "";
            }
          } catch (error) {
            console.error(`Error fetching image for ${location.name}:`, error);
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setLocationImages(images);
      } catch (error) {
        console.error("Error loading Google Places images:", error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchGooglePlaceImages();
  }, [locations]);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [16.0, 106.0],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 2,
      });

      tileLayer.addTo(map);

      tileLayer.on('loading', () => setTilesLoaded(false));
      tileLayer.on('load', () => setTilesLoaded(true));

      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
        }
      }, 100);

      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
          setMapLoaded(true);
        }
      }, 500);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const timeouts = [100, 300, 500, 1000];
      timeouts.forEach(delay => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });
    }
  }, [showImagePanel, locations.length]);

  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current!;
      const markersLayer = markersLayerRef.current!;

      markersLayer.clearLayers();

      if (locations.length === 0) return;

      const aiLocationIcon = L.divIcon({
        className: "ai-location-marker",
        html: `<div style="
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(59,130,246,0.5);
        "><div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const bounds = L.latLngBounds([]);

      locations.forEach((loc, index) => {
        const marker = L.marker([loc.lat, loc.lon], { icon: aiLocationIcon })
          .addTo(markersLayer)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1e293b;">${index + 1}. ${loc.name}</h3>
              <p style="color: #64748b; font-size: 13px; margin-bottom: 4px;">📍 ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}</p>
            </div>
          `);

        bounds.extend([loc.lat, loc.lon]);

        marker.on('click', () => {
          setSelectedLocationIndex(index);
        });
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    });
  }, [locations]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ Geolocation.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        if (mapInstanceRef.current) {
          import("leaflet").then((L) => {
            const userIcon = L.divIcon({
              className: "user-location-marker",
              html: '<div style="background-color: #FF4757; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(255,71,87,0.6);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            L.marker([latitude, longitude], { icon: userIcon })
              .addTo(mapInstanceRef.current!)
              .bindPopup("<b>Vị trí của bạn</b>")
              .openPopup();

            mapInstanceRef.current!.setView([latitude, longitude], 14);
          });
        }
      },
      () => {
        setIsLocating(false);
        alert("Không thể lấy vị trí của bạn.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([15.5, 109.0], 6);
    }
  };

  const handleClearLocations = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    setLocationImages({});
    onClearLocations?.();
  };

  const getLocationImageUrl = (locationName: string): string => {
    return locationImages[locationName] || "/images/elementor-placeholder-image.webp";
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Map container - Takes most space */}
      <div
        className={`relative transition-all duration-300 ${locations.length > 0 && showImagePanel ? 'h-[70%]' : 'h-full'}`}
        style={{ minHeight: '400px' }}
      >
        {/* Google Static Map Background */}
        {locations.length > 0 && GOOGLE_MAPS_API_KEY && (
          <div className="absolute inset-0 z-0">
            <Image
              src={getStaticMapUrl()}
              alt="Static Map"
              fill
              className="object-cover"
              unoptimized
            />
            {!tilesLoaded && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white text-xs bg-black/60 px-3 py-1.5 rounded-lg">
                  🗺️ Đang tải bản đồ tương tác...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaflet Interactive Map */}
        <div
          ref={mapRef}
          className="absolute inset-0 z-10"
          style={{ background: 'transparent' }}
        />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-20 bg-slate-900/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2 mx-auto" />
              <p className="text-white/70 text-xs">Đang khởi tạo bản đồ...</p>
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
          <button
            onClick={requestLocation}
            disabled={isLocating}
            className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 disabled:opacity-50 group"
            title="Xác định vị trí"
          >
            <FaLocationArrow className={`text-blue-600 text-sm ${isLocating ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 group"
            title="Đặt lại góc nhìn"
          >
            <FaGlobeAmericas className="text-purple-600 text-sm group-hover:scale-110 transition-transform" />
          </button>
          {locations.length > 0 && (
            <button
              onClick={handleClearLocations}
              className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 group"
              title="Xóa markers"
            >
              <FaTrash className="text-red-600 text-sm group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Image Panel - Horizontal at bottom */}
      {locations.length > 0 && showImagePanel && (
        <div className="h-[30%] border-t border-white/10 flex flex-col bg-slate-900/95 backdrop-blur">
          {/* Compact Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-white text-xs" />
              <span className="text-white text-xs font-bold">Địa điểm ({locations.length})</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowImagePanel(false); }}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              title="Đóng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Horizontal Scrollable Gallery */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
            {loadingImages ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2 mx-auto" />
                  <p className="text-white/70 text-xs">Đang tải hình ảnh...</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 h-full">
                {locations.map((loc, index) => (
                  <button
                    key={`loc-${index}-${loc.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocationIndex(index);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([loc.lat, loc.lon], 13);
                      }
                    }}
                    className={`relative flex-shrink-0 h-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedLocationIndex === index
                        ? 'border-blue-500 shadow-lg shadow-blue-500/50 scale-105'
                        : 'border-white/20 hover:border-white/40'
                      }`}
                  >
                    <Image
                      src={getLocationImageUrl(loc.name)}
                      alt={loc.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{loc.name}</p>
                          <p className="text-cyan-300 text-[10px] flex items-center gap-1">
                            <FaMapMarkerAlt className="text-[8px]" />
                            {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show panel button when hidden */}
      {locations.length > 0 && !showImagePanel && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowImagePanel(true); }}
          className="absolute bottom-3 right-3 z-30 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
        >
          <FaImages className="text-sm" />
          <span className="text-xs font-medium">Hiện hình ảnh ({locations.length})</span>
        </button>
      )}
    </div>
  );
};

export default LeafletMap;
