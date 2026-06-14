import { NextResponse } from "next/server";

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return NextResponse.json({
    configured: !!(cloudName && apiKey && apiSecret),
    cloudName: cloudName ? 'Set: ' + cloudName : 'Missing',
    apiKey: apiKey ? 'Set: ' + apiKey.substring(0, 8) + '...' : 'Missing',
    apiSecret: apiSecret ? 'Set: ' + apiSecret.substring(0, 5) + '...' : 'Missing',
    envFiles: {
      'process.env.NODE_ENV': process.env.NODE_ENV,
      'Should load': ['.env', '.env.local', '.env.development.local']
    }
  });
}
