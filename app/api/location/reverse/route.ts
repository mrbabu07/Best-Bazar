import { NextRequest, NextResponse } from "next/server";
import { safeResponseJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

function coordinate(value: string | null, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: NextRequest) {
  const lat = coordinate(request.nextUrl.searchParams.get("lat"), -85, 85);
  const lng = coordinate(request.nextUrl.searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("layer", "address");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("accept-language", "en");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Best-Mart-Checkout/1.0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
    }

    const result = await safeResponseJson<Record<string, unknown>>(response, {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
  }
}
