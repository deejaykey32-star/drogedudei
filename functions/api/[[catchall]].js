// Cloudflare Pages Functions dla DrogEduDei: informacje o APK i generowanie kodu QR
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname;

  const jsonResponse = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });

  // Pobieranie APK info
  if (path === "/api/download/info") {
    return jsonResponse({
      available: true,
      size: 5976883,
      updated: Date.now(),
      path: "/download/DrogEduDei.apk",
      lan: ["https://drogedudei.pages.dev/download/DrogEduDei.apk"],
    });
  }

  // Kod QR do pobrania APK aparatem telefonu
  if (path === "/api/download/qr") {
    const u = url.searchParams.get("u") || "https://drogedudei.pages.dev/download/DrogEduDei.apk";
    return Response.redirect(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(u)}`, 302);
  }

  return jsonResponse({ error: "Not Found" }, 404);
}
