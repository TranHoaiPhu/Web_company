/**
 * Client-side Chatbot Helper using Google Places API
 * Replaces backend chatbot service
 */

export interface ChatbotResponse {
  success: boolean;
  response?: string;
  locations?: Array<{ name: string; lat: number; lon: number }>;
  error?: string;
}

// Keywords to detect intent
const LOCATION_KEYWORDS = ["địa điểm", "nơi", "đâu", "gợi ý", "recommend", "suggest", "place", "where"];
const TRIP_KEYWORDS = ["lộ trình", "kế hoạch", "du lịch", "travel", "trip", "itinerary", "plan"];
const FOOD_KEYWORDS = ["ăn", "nhà hàng", "quán", "food", "restaurant", "eat", "cafe"];
const HOTEL_KEYWORDS = ["khách sạn", "hotel", "chỗ ở", "accommodation", "stay", "resort"];

/**
 * Process user message and generate response using Google Places API
 */
export async function processMessageWithGoogle(
  message: string,
  sessionHistory: Array<{ role: string; content: string }> = []
): Promise<ChatbotResponse> {
  const messageLower = message.toLowerCase();

  try {
    // Ensure Google Maps is loaded
    if (typeof window === "undefined" || !window.google?.maps) {
      throw new Error("Google Maps API not loaded");
    }

    // Detect intent and location from message
    const { intent, location } = detectIntent(message);

    if (!location) {
      // No location detected - provide general response
      return {
        success: true,
        response: generateGeneralResponse(intent, message),
        locations: [],
      };
    }

    // Load Places library
    const { Place } = (await google.maps.importLibrary(
      "places"
    )) as google.maps.PlacesLibrary;

    // Build search query based on intent
    let searchQuery = "";
    if (intent === "food") {
      searchQuery = `nhà hàng quán ăn ngon ở ${location}, Việt Nam`;
    } else if (intent === "hotel") {
      searchQuery = `khách sạn resort ở ${location}, Việt Nam`;
    } else if (intent === "trip") {
      searchQuery = `địa điểm du lịch nổi tiếng ở ${location}, Việt Nam`;
    } else {
      searchQuery = `điểm đến du lịch ở ${location}, Việt Nam`;
    }

    console.log("Chatbot searching:", searchQuery);

    // Search with Google Places
    const { places } = await Place.searchByText({
      textQuery: searchQuery,
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'types'],
      maxResultCount: 10,
      language: 'vi',
      region: 'VN',
    });

    if (!places || places.length === 0) {
      return {
        success: true,
        response: `Xin lỗi, tôi không tìm thấy thông tin về ${location}. Bạn có thể thử hỏi về các địa điểm khác như Hà Nội, Đà Nẵng, Nha Trang, Phú Quốc, Hội An, v.v.`,
        locations: [],
      };
    }

    // Extract locations for map
    const locations = places.slice(0, 10).map(place => ({
      name: place.displayName || "Unknown",
      lat: place.location?.lat() || 0,
      lon: place.location?.lng() || 0,
    })).filter(loc => loc.lat !== 0 && loc.lon !== 0);

    // Generate response text
    const responseText = generatePlacesResponse(intent, location, places, locations.length);

    return {
      success: true,
      response: responseText,
      locations: locations,
    };

  } catch (error) {
    console.error("Chatbot error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      response: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.",
    };
  }
}

/**
 * Detect user intent and location from message
 */
function detectIntent(message: string): { intent: string; location: string | null } {
  const messageLower = message.toLowerCase();

  // Detect intent
  let intent = "general";
  if (FOOD_KEYWORDS.some(kw => messageLower.includes(kw))) {
    intent = "food";
  } else if (HOTEL_KEYWORDS.some(kw => messageLower.includes(kw))) {
    intent = "hotel";
  } else if (TRIP_KEYWORDS.some(kw => messageLower.includes(kw))) {
    intent = "trip";
  }

  // Extract location - look for Vietnamese city names
  const vietnamCities = [
    "hà nội", "sài gòn", "hồ chí minh", "đà nẵng", "hội an", "huế",
    "nha trang", "đà lạt", "phú quốc", "hạ long", "sapa", "sa pa",
    "ninh bình", "vũng tàu", "cần thơ", "quy nhơn", "phan thiết",
    "mũi né", "hạ long", "cát bà", "mai châu", "hà giang",
  ];

  let detectedLocation: string | null = null;
  for (const city of vietnamCities) {
    if (messageLower.includes(city)) {
      detectedLocation = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  return { intent, location: detectedLocation };
}

/**
 * Generate response text based on places found
 */
function generatePlacesResponse(
  intent: string,
  location: string,
  places: google.maps.places.Place[],
  locationCount: number
): string {
  let intro = "";

  if (intent === "food") {
    intro = `Dưới đây là các nhà hàng và quán ăn ngon tại ${location}:`;
  } else if (intent === "hotel") {
    intro = `Dưới đây là các khách sạn và resort tại ${location}:`;
  } else if (intent === "trip") {
    intro = `Dưới đây là các địa điểm du lịch nổi tiếng tại ${location}:`;
  } else {
    intro = `Dưới đây là các điểm đến tại ${location}:`;
  }

  const placesList = places
    .slice(0, 10)
    .map((place, index) => {
      const name = place.displayName || "Unknown";
      const rating = place.rating ? ` (⭐ ${place.rating.toFixed(1)})` : "";
      const address = place.formattedAddress ? ` - ${place.formattedAddress}` : "";
      return `${index + 1}. **${name}**${rating}${address}`;
    })
    .join("\n");

  const mapNote = locationCount > 0
    ? `\n\n📍 Tôi đã đánh dấu ${locationCount} địa điểm trên bản đồ bên phải. Bạn có thể xem vị trí và hình ảnh của từng địa điểm.`
    : "";

  return `${intro}\n\n${placesList}${mapNote}\n\nBạn muốn biết thêm thông tin gì về ${location} không?`;
}

/**
 * Generate general response when no location detected
 */
function generateGeneralResponse(intent: string, message: string): string {
  const greetings = ["xin chào", "hello", "hi", "chào"];
  const thanks = ["cảm ơn", "thank", "cám ơn"];

  const messageLower = message.toLowerCase();

  if (greetings.some(g => messageLower.includes(g))) {
    return `Xin chào! 👋 Tôi là trợ lý du lịch AI của bạn. Tôi có thể giúp bạn:\n\n` +
      `✈️ Tìm kiếm địa điểm du lịch\n` +
      `🍜 Gợi ý nhà hàng và quán ăn\n` +
      `🏨 Tìm khách sạn và chỗ ở\n` +
      `📍 Lập kế hoạch lộ trình du lịch\n\n` +
      `Bạn muốn tìm hiểu về địa điểm nào ở Việt Nam?`;
  }

  if (thanks.some(t => messageLower.includes(t))) {
    return `Không có gì! 😊 Tôi luôn sẵn sàng giúp đỡ bạn lên kế hoạch chuyến đi. Bạn còn cần hỏi gì nữa không?`;
  }

  // Default response - ask for location
  return `Tôi có thể giúp bạn tìm thông tin du lịch tại Việt Nam! 🇻🇳\n\n` +
    `Vui lòng cho tôi biết bạn muốn tìm hiểu về địa điểm nào? Ví dụ:\n` +
    `- "Gợi ý địa điểm du lịch ở Đà Nẵng"\n` +
    `- "Nhà hàng ngon ở Hà Nội"\n` +
    `- "Khách sạn tại Nha Trang"\n` +
    `- "Lập kế hoạch du lịch Hội An 3 ngày"`;
}
