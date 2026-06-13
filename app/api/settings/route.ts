import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getPublicSettings();

  return Response.json(settings, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
