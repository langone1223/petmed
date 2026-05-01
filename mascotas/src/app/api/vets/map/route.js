import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    const query = `[out:json];nwr(around:5000,${lat},${lng})[amenity=veterinary];out center;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    const response = await fetch(overpassUrl, {
      headers: {
        'User-Agent': 'PetMed-App/1.0 (production)'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to Overpass API:', error);
    return NextResponse.json({ error: 'Failed to fetch map data', elements: [] }, { status: 500 });
  }
}
