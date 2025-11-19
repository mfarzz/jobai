import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractCityFromLocation(location: string | null): string | null {
  if (!location) return null;
  
  // Split by comma and get parts
  const parts = location.split(',').map(p => p.trim());
  
  // Remove "Indonesia" if present
  const filteredParts = parts.filter(p => 
    !p.toLowerCase().includes('indonesia') && 
    p.length > 0
  );
  
  if (filteredParts.length === 0) return null;
  
  // Common Indonesian provinces (to identify city before province)
  const provinces = [
    'jakarta', 'jawa barat', 'jawa tengah', 'jawa timur', 
    'bali', 'sumatera utara', 'sumatera selatan', 'sumatera barat',
    'kalimantan', 'sulawesi', 'papua', 'yogyakarta', 'banten',
    'lampung', 'riau', 'kepulauan riau', 'jambi', 'sumatera',
    'bengkulu', 'aceh', 'ntb', 'ntt', 'maluku', 'sulawesi utara',
    'sulawesi selatan', 'sulawesi tengah', 'sulawesi tenggara',
    'kalimantan barat', 'kalimantan timur', 'kalimantan selatan',
    'kalimantan tengah', 'kalimantan utara', 'papua barat'
  ];
  
  // Find province index
  let provinceIndex = -1;
  for (let i = filteredParts.length - 1; i >= 0; i--) {
    const part = filteredParts[i].toLowerCase();
    if (provinces.some(p => part.includes(p))) {
      provinceIndex = i;
      break;
    }
  }
  
  // If province found, city is usually before it
  if (provinceIndex > 0) {
    return filteredParts[provinceIndex - 1];
  }
  
  // If no province found, try to get 2nd or 3rd from end
  if (filteredParts.length >= 2) {
    return filteredParts[filteredParts.length - 2];
  }
  
  // Fallback: return last part
  return filteredParts[filteredParts.length - 1];
}

export async function GET(request: NextRequest) {
  try {
    // Get all jobs to extract unique categories and cities
    const jobs = await prisma.job.findMany({
      select: {
        category: true,
        location: true,
      },
      where: {
        OR: [
          { category: { not: null } },
          { location: { not: null } },
        ],
      },
    });

    // Extract unique categories
    const categorySet = new Set<string>();
    jobs.forEach(job => {
      if (job.category) {
        categorySet.add(job.category);
      }
    });
    const categories = Array.from(categorySet)
      .sort()
      .slice(0, 10) // Top 10 categories
      .map(cat => ({
        label: cat,
        value: cat,
        filter: 'category' as const,
      }));

    // Extract unique cities from locations
    const citySet = new Set<string>();
    jobs.forEach(job => {
      if (job.location) {
        const city = extractCityFromLocation(job.location);
        if (city) {
          citySet.add(city);
        }
      }
    });
    const cities = Array.from(citySet)
      .sort()
      .slice(0, 10) // Top 10 cities
      .map(city => ({
        label: city,
        value: city,
        filter: 'city' as const,
      }));

    return NextResponse.json({
      categories,
      cities,
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters", categories: [], cities: [] },
      { status: 500 }
    );
  }
}

