// app/api/weather/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  
  // Use Open-Meteo API (free, no API key required)
  // Docs: https://open-meteo.com/en/docs

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "Thiếu lat hoặc lon" }), {
      status: 400,
    });
  }

  // Open-Meteo API - completely free, no API key needed
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch weather" }), {
        status: res.status,
      });
    }

    // Convert Open-Meteo format to OpenWeatherMap-like format for compatibility
    const weatherData = {
      weather: [
        {
          description: getWeatherDescription(data.current.weather_code),
        },
      ],
      main: {
        temp: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
      },
      wind: {
        speed: data.current.wind_speed_10m,
      },
    };

    return new Response(JSON.stringify(weatherData), { status: 200 });
  } catch (error) {
    console.error("Weather API error:", error);
    return new Response(JSON.stringify({ error: "Lỗi server" }), {
      status: 500,
    });
  }
}

// Convert WMO Weather codes to Vietnamese descriptions
// Reference: https://open-meteo.com/en/docs
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: "Trời quang",
    1: "Trời quang, ít mây",
    2: "Trời nhiều mây",
    3: "U ám",
    45: "Sương mù",
    48: "Sương mù đóng băng",
    51: "Mưa phùn nhẹ",
    53: "Mưa phùn vừa",
    55: "Mưa phùn dày đặc",
    61: "Mưa nhỏ",
    63: "Mưa vừa",
    65: "Mưa to",
    71: "Tuyết nhỏ",
    73: "Tuyết vừa",
    75: "Tuyết to",
    77: "Tuyết hạt",
    80: "Mưa rào nhẹ",
    81: "Mưa rào vừa",
    82: "Mưa rào to",
    85: "Tuyết rào nhẹ",
    86: "Tuyết rào nặng",
    95: "Dông",
    96: "Dông có mưa đá nhẹ",
    99: "Dông có mưa đá to",
  };
  
  return weatherCodes[code] || "Không xác định";
}
