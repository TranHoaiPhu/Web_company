// src/app/robots.txt/route.ts
export async function GET() {
  const content = `User-agent: *\nDisallow: /api/\nAllow: /\nSitemap: https://ai-trip-system.vercel.app/sitemap.xml`;
  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "s-maxage=31536000",
    },
  });
}
