/**
 * Client-side Trip Generator using Google Places API
 * Replaces backend AI trip generation
 */

export interface TripGeneratorInput {
  destination: string;
  days: number;
  startDate: string;
  interests: string[];
  travelStyle?: string;
  accommodation?: string;
  transportation?: string;
}

export interface Activity {
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

export interface TripDay {
  day: number;
  date: string;
  activities: Activity[];
}

export interface TripPlan {
  name: string;
  parameters: {
    location: string;
    days: TripDay[];
  };
}

// Map interests to place types and search queries
const INTEREST_TO_QUERY_MAP: Record<string, string[]> = {
  "culture": ["museum", "historical landmark", "temple", "pagoda", "cultural center"],
  "food": ["restaurant", "cafe", "street food", "local food"],
  "nature": ["park", "garden", "lake", "mountain", "waterfall"],
  "beach": ["beach", "seaside", "coastal area"],
  "shopping": ["shopping mall", "market", "souvenir shop"],
  "nightlife": ["bar", "club", "entertainment"],
};

// Time slots for activities
const TIME_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
];

/**
 * Generate a trip itinerary using Google Places API
 */
export async function generateTripWithGoogle(
  input: TripGeneratorInput
): Promise<TripPlan> {
  const { destination, days, startDate, interests } = input;

  // Ensure Google Maps is loaded
  if (typeof window === "undefined" || !window.google?.maps) {
    throw new Error("Google Maps API not loaded");
  }

  // Load Places library
  const { Place } = (await google.maps.importLibrary(
    "places"
  )) as google.maps.PlacesLibrary;

  // Generate search queries based on interests
  const searchQueries: string[] = [];

  // Add attraction queries based on interests
  interests.forEach(interest => {
    const queries = INTEREST_TO_QUERY_MAP[interest] || [];
    queries.forEach(query => {
      searchQueries.push(`${query} in ${destination}, Vietnam`);
    });
  });

  // Always add general queries
  searchQueries.push(`tourist attractions in ${destination}, Vietnam`);
  searchQueries.push(`things to do in ${destination}, Vietnam`);
  searchQueries.push(`restaurants in ${destination}, Vietnam`);

  // Fetch places from Google
  const allPlaces: Activity[] = [];
  const seenNames = new Set<string>();

  console.log("Searching for places with queries:", searchQueries);

  for (const query of searchQueries.slice(0, 5)) { // Limit to 5 queries to avoid rate limits
    try {
      const { places } = await Place.searchByText({
        textQuery: query,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'types'],
        maxResultCount: 10,
        language: 'vi',
        region: 'VN',
      });

      if (places && places.length > 0) {
        places.forEach(place => {
          const name = place.displayName || "Unknown Place";

          // Skip duplicates
          if (seenNames.has(name)) return;
          seenNames.add(name);

          const lat = place.location?.lat();
          const lon = place.location?.lng();

          if (typeof lat !== "number" || typeof lon !== "number") return;

          const activity: Activity = {
            time: "", // Will be assigned later
            name: name,
            lat: lat,
            lon: lon,
            description: place.formattedAddress || `Visit ${name}`,
            namePlace: name,
            city: destination,
            province: destination,
            address: place.formattedAddress || destination,
            rating: typeof place.rating === "number" ? place.rating : 4.0,
          };

          allPlaces.push(activity);
        });
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Found ${allPlaces.length} unique places`);

  // If no places found, return empty trip
  if (allPlaces.length === 0) {
    throw new Error(`Không tìm thấy địa điểm nào tại ${destination}. Vui lòng thử lại với tên thành phố khác.`);
  }

  // Organize places into daily itineraries
  const tripDays: TripDay[] = [];
  const activitiesPerDay = Math.max(3, Math.min(7, Math.floor(allPlaces.length / days)));

  let activityIndex = 0;
  const startDateObj = new Date(startDate);

  for (let dayNum = 1; dayNum <= days; dayNum++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + (dayNum - 1));
    const dateStr = currentDate.toISOString().split('T')[0];

    const dayActivities: Activity[] = [];

    // Assign activities for this day
    for (let i = 0; i < activitiesPerDay && activityIndex < allPlaces.length; i++) {
      const activity = { ...allPlaces[activityIndex] };

      // Assign time slot
      const timeSlotIndex = Math.min(i, TIME_SLOTS.length - 1);
      activity.time = TIME_SLOTS[timeSlotIndex];

      dayActivities.push(activity);
      activityIndex++;
    }

    // If we run out of activities, reuse some
    while (dayActivities.length < 3 && allPlaces.length > 0) {
      const randomActivity = { ...allPlaces[Math.floor(Math.random() * allPlaces.length)] };
      randomActivity.time = TIME_SLOTS[dayActivities.length % TIME_SLOTS.length];
      dayActivities.push(randomActivity);
    }

    tripDays.push({
      day: dayNum,
      date: dateStr,
      activities: dayActivities,
    });
  }

  const tripPlan: TripPlan = {
    name: `${destination} ${days} Ngày`,
    parameters: {
      location: destination,
      days: tripDays,
    },
  };

  return tripPlan;
}
