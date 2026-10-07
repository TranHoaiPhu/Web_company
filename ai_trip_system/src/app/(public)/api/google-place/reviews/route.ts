// app/api/google-place/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";

// Prefer server-side GOOGLE_API_KEY, fallback to public Places key
const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "Missing Google API key on server" },
      { status: 500 }
    );
  }

  try {
    const nearbyRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=30&key=${GOOGLE_API_KEY}`
    );
    const nearbyData = await nearbyRes.json();

    if (!nearbyData.results || nearbyData.results.length === 0) {
      return NextResponse.json({ error: "No places found" }, { status: 404 });
    }

    const placeId = nearbyData.results[0].place_id;

    const detailRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating&language=vi&key=${GOOGLE_API_KEY}`
    );
    const detailData = await detailRes.json();

    return NextResponse.json(detailData.result || {});
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
