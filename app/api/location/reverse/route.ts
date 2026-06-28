import { NextRequest, NextResponse } from "next/server";
import { safeResponseJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

type ArcGisReverseResponse = {
  address?: {
    Addr_type?: string;
    AddNum?: string;
    PlaceName?: string;
    ShortLabel?: string;
    X?: number;
    Y?: number;
  };
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasApartmentOrBuilding(result: Record<string, unknown>) {
  const address = record(result.address);
  const extratags = record(result.extratags);

  return [
    address.unit,
    address.flat,
    address.apartment,
    address.apartments,
    address.house_number,
    address.house_name,
    address.building,
    extratags["addr:unit"],
    extratags["addr:flats"],
    extratags["addr:housenumber"],
    extratags["addr:housename"]
  ].some((value) => text(value));
}

function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const latDelta = radians(lat2 - lat1);
  const lngDelta = radians(lng2 - lng1);
  const value =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(lngDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

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

    const arcGisUrl = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode");
    arcGisUrl.searchParams.set("location", `${lng},${lat}`);
    arcGisUrl.searchParams.set("f", "json");
    arcGisUrl.searchParams.set("langCode", "EN");
    arcGisUrl.searchParams.set("featureTypes", "Subaddress,PointAddress");
    const arcGisRequest = fetch(arcGisUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);

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

    if (!hasApartmentOrBuilding(result)) {
      const arcGisResponse = await arcGisRequest;

      if (arcGisResponse?.ok) {
        const arcGisResult = await safeResponseJson<ArcGisReverseResponse>(arcGisResponse, {});
        const arcAddress = arcGisResult.address;
        const resultX = Number(arcAddress?.X);
        const resultY = Number(arcAddress?.Y);
        const isCloseMatch =
          Number.isFinite(resultX) &&
          Number.isFinite(resultY) &&
          distanceInMeters(lat, lng, resultY, resultX) <= 50;
        const addressNumber = text(arcAddress?.AddNum);
        const placeName = text(arcAddress?.PlaceName);
        const addressType = text(arcAddress?.Addr_type);
        const canUsePlaceName = ["POI", "PointAddress", "Subaddress"].includes(addressType);
        const apartmentOrBuilding = isCloseMatch
          ? addressNumber || (canUsePlaceName ? placeName : "")
          : "";

        if (apartmentOrBuilding) {
          result.address = {
            ...record(result.address),
            ...(addressNumber
              ? { house_number: addressNumber }
              : { building: apartmentOrBuilding })
          };
        }
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
  }
}
