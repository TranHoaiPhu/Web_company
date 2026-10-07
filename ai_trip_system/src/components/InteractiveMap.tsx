"use client";

import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Maximize2, Minimize2, Search, MapPin, Loader2, Navigation } from 'lucide-react';

// Google Maps API types
declare global {
  interface Window {
    google: typeof google | undefined;
    // Add the bootstrap loader function to window type
    gm_authFailure?: () => void;
  }
}

interface InteractiveMapProps {
  isExpanded: boolean;
  onExpandToggle: () => void;
  googleMapsApiKey: string;
}

export default function InteractiveMap({ isExpanded, onExpandToggle, googleMapsApiKey }: InteractiveMapProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Refs for Libraries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapsLibRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesLibRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coreLibRef = useRef<any>(null);

  // Load Google Maps API using Dynamic Library Import (Bootstrap Loader)
  useEffect(() => {
    const initMap = async () => {
      // Define the bootstrap loader inline
      // @ts-expect-error - Google Maps bootstrap loader with complex types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-var, @typescript-eslint/no-unused-expressions
      (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.getAttribute("nonce") || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: googleMapsApiKey,
        v: "weekly",
        language: "vi",
        // Add other parameters here if needed
      });

      try {
        // Import necessary libraries
        const [mapsLib, placesLib, coreLib] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.google!.maps.importLibrary("maps") as Promise<any>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.google!.maps.importLibrary("places") as Promise<any>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          window.google!.maps.importLibrary("core") as Promise<any>,
        ]);

        mapsLibRef.current = mapsLib;
        placesLibRef.current = placesLib;
        coreLibRef.current = coreLib;

        // ---------------------------------------------------------
        // APP CHECK PLACEHOLDER (Requires Firebase)
        // ---------------------------------------------------------
        // To enable App Check for Google Places (New), you need to:
        // 1. Set up Firebase in your project.
        // 2. Uncomment the following code block.
        /*
        const { initializeApp } = await import("firebase/app");
        const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");

        const app = initializeApp({
          // Your firebase configuration object here
          apiKey: "...",
          authDomain: "...",
          projectId: "...",
          storageBucket: "...",
          messagingSenderId: "...",
          appId: "..." 
        });

        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider('YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY'),
          isTokenAutoRefreshEnabled: true,
        });
        
        // Link App Check to Google Maps
        // @ts-ignore
        coreLib.Settings.getInstance().fetchAppCheckToken = () => 
           // @ts-ignore
           getToken(appCheck, false);
        */
        // ---------------------------------------------------------

        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps libraries:", error);
      }
    };

    if (!mapLoaded) {
      initMap();
    }
  }, [googleMapsApiKey, mapLoaded]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current || !mapsLibRef.current) return;

    const { Map } = mapsLibRef.current;

    const defaultCenter = { lat: 21.0285, lng: 105.8542 };

    const map = new Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      // mapId: "DEMO_MAP_ID", 
      styles: [
        {
          "featureType": "all",
          "elementType": "geometry",
          "stylers": [{ "color": "#242f3e" }]
        },
        {
          "featureType": "all",
          "elementType": "labels.text.stroke",
          "stylers": [{ "lightness": -80 }]
        },
        {
          "featureType": "administrative",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#746855" }]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{ "color": "#17263c" }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
    });

    googleMapRef.current = map;

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
          map.setCenter(pos);

          new window.google!.maps.Marker({
            position: pos,
            map: map,
            title: 'Vị trí của bạn',
            icon: {
              path: window.google!.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
        },
        () => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }, [mapLoaded]);

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Search places using Places SDK (New)
  const searchPlaces = async () => {
    if (!searchQuery.trim() || !placesLibRef.current || !googleMapRef.current) return;

    setIsSearching(true);
    clearMarkers();

    try {
      const { Place } = placesLibRef.current;

      // Text Search request
      // https://developers.google.com/maps/documentation/javascript/place-search#text-search
      const { places } = await Place.searchByText({
        textQuery: searchQuery,
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'photos'], // Updated fields for New API
        locationBias: googleMapRef.current.getCenter(),
      });

      if (places && places.length > 0) {
        const bounds = new window.google!.maps.LatLngBounds();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        places.forEach((place: any, index: number) => {
          if (!place.location) return;

          const marker = new window.google!.maps.Marker({
            position: place.location, // place.location is LatLng in new API
            map: googleMapRef.current,
            title: place.displayName,
            animation: window.google!.maps.Animation.DROP,
            label: {
              text: `${index + 1}`,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            },
          });

          // Create info window
          const infoWindow = new window.google!.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${place.displayName}</h3>
                ${place.formattedAddress ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">${place.formattedAddress}</p>` : ''}
                ${place.rating ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #059669;">⭐ ${place.rating}/5</p>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(place.location);
        });

        googleMapRef.current.fitBounds(bounds);

      } else {
        alert('Không tìm thấy địa điểm nào. Vui lòng thử lại với từ khóa khác.');
      }
    } catch (error) {
      console.error("Error searching places:", error);
      alert('Đã xảy ra lỗi khi tìm kiếm.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchPlaces();
    }
  };

  const goToCurrentLocation = () => {
    if (currentLocation && googleMapRef.current) {
      googleMapRef.current.setCenter(currentLocation);
      googleMapRef.current.setZoom(15);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(pos);
            googleMapRef.current.setZoom(15);
          }
        },
        () => {
          alert('Không thể lấy vị trí hiện tại. Vui lòng bật định vị.');
        }
      );
    }
  };

  return (
    <div
      className="relative h-full backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 py-6 bg-gradient-to-b from-black/80 via-black/60 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50" />
              <MapIcon className="relative w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Bản Đồ Tương Tác
              </h2>
              <p className="text-xs text-gray-400">Tìm kiếm địa điểm du lịch</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToCurrentLocation}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group/nav"
              title="Vị trí hiện tại"
            >
              <Navigation className="w-5 h-5 text-cyan-400 group-hover/nav:scale-110 transition-transform" />
            </button>
            <button
              onClick={onExpandToggle}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group/expand"
            >
              {isExpanded ? (
                <Minimize2 className="w-5 h-5 text-cyan-400 group-hover/expand:scale-90 transition-transform" />
              ) : (
                <Maximize2 className="w-5 h-5 text-cyan-400 group-hover/expand:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tìm kiếm địa điểm (ví dụ: nhà hàng Hà Nội, khách sạn Đà Lạt)..."
            className="w-full px-5 py-3 pl-12 pr-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-gray-400 transition-all duration-300"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <button
            onClick={searchPlaces}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-full w-full">
        {mapLoaded ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
            {/* Animated Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Loading Content */}
            <div className="relative z-10 text-center space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-50 animate-pulse" />
                <Loader2 className="relative w-24 h-24 text-cyan-400 mx-auto animate-spin" />
              </div>
              <p className="text-gray-300 text-lg">Đang tải bản đồ...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent transition-opacity duration-300 pointer-events-none ${isHovering ? 'opacity-100' : 'opacity-0'
          }`}
      />
    </div>
  );
}
