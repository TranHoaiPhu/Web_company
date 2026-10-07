import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PlaceResponse } from "@/types/backend";

type PlaceImageProps = {
  idPlace?: string; // Optional now since we only use place data
  place?: PlaceResponse; // Place object for Google Photos lookup
  altText?: string;
  className?: string;
  width?: number;
  height?: number;
};

const PlaceImage = ({
  place,
  altText = "Place image",
  className = "",
}: PlaceImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>("/images/elementor-placeholder-image.webp");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Ref to track if we've already tried Google fallback to prevent loops
  const triedGoogleFallback = useRef(false);

  useEffect(() => {
    const fetchImage = async () => {
      setIsLoading(true);

      // Always use Google Photos API - no backend calls
      if (!place) {
        setImageUrl("/images/elementor-placeholder-image.webp");
        setIsLoading(false);
        return;
      }

      await fetchGooglePhoto();
    };

    const fetchGooglePhoto = async () => {
      if (triedGoogleFallback.current) {
        setIsLoading(false);
        return;
      }
      triedGoogleFallback.current = true;

      // Ensure we have place data to search with
      if (!place) {
        setImageUrl("/images/elementor-placeholder-image.webp");
        setIsLoading(false);
        return;
      }

      try {
        // Dynamic import of Google Maps Libraries
        const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        if (!googleMapsApiKey) {
          console.error("No Google Maps API Key found");
          setImageUrl("/images/elementor-placeholder-image.webp");
          setIsLoading(false);
          return;
        }

        // Bootstrap loader pattern
        const loadGoogleMaps = () => {
          return new Promise<void>((resolve, reject) => {
            if (window.google?.maps?.places) {
              resolve();
              return;
            }

            const scriptId = 'google-maps-script-place-image';
            if (document.getElementById(scriptId)) {
              // Script already loading/loaded, wait a bit
              const checkInterval = setInterval(() => {
                if (window.google?.maps?.places) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 100);
              return;
            }

            // If InteractiveMap loaded it, we might be good.
            // If not, we rely on the implementation in InteractiveMap or load libraries here.
            // Since this component is independent, we should safely access libraries via importLibrary
            // But we need the bootstrap script first.
            // Assuming the app has loaded the script via layout or InteractiveMap.
            // If not, we fallback to placeholder to avoid complex script injection race conditions here.
            if (window.google?.maps) {
              resolve();
            } else {
              // Simple check: if <script> exists on page
              const scripts = document.querySelectorAll('script');
              let found = false;
              scripts.forEach(s => {
                if (s.src && s.src.includes('maps.googleapis.com')) found = true;
              });
              if (found) {
                const checkInterval = setInterval(() => {
                  if (window.google?.maps) {
                    clearInterval(checkInterval);
                    resolve();
                  }
                }, 100);
              } else {
                reject("Google Maps script not loaded");
              }
            }
          });
        };

        await loadGoogleMaps();

        const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const { LatLng } = await google.maps.importLibrary("core") as google.maps.CoreLibrary;

        // Use Text Search (New API) or Find Place? 
        // SearchByText is robust.
        // We prioritize searching by Name + Address/City to get the right place.
        const query = `${place.name} ${place.address || ''}`;

        console.log("Searching Google Photos for:", query);

        const { places } = await Place.searchByText({
          textQuery: query,
          fields: ['photos'],
          locationBias: place.lat && place.lon ? new LatLng(place.lat, place.lon) : undefined,
          maxResultCount: 1,
        });

        if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
          const photo = places[0].photos[0];
          // Get URL. max width 400 is plenty for cards
          const url = photo.getURI({ maxWidth: 400, maxHeight: 400 });
          setImageUrl(url || "/images/elementor-placeholder-image.webp");
        } else {
          console.log("No Google photos found for:", query);
          setImageUrl("/images/elementor-placeholder-image.webp");
        }

      } catch (error) {
        console.error("Error fetching Google Photo:", error);
        setImageUrl("/images/elementor-placeholder-image.webp");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [place]); // Re-run only when place data changes

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
          loading="lazy"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageUrl("/images/elementor-placeholder-image.webp")}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Image
            src="/images/elementor-placeholder-image.webp"
            alt={altText}
            className="w-full h-full object-cover opacity-50"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
    </div>
  );
};

export default PlaceImage;
