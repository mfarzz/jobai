import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

function extractShortDescription(html: string | null): string {
  if (!html) return "No description available";
  
  // Remove HTML tags and get first 150 characters
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > 150 ? text.substring(0, 150) + "..." : text;
}

function extractCityFromLocation(location: string | null): string | null {
  if (!location) return null;
  
  // Split by comma and get parts
  const parts = location.split(',').map(p => p.trim());
  
  // Common Indonesian city patterns:
  // Usually format: "street, district, subdistrict, regency, province, country"
  // Or: "street, district, city, province, country"
  // City is usually 2nd or 3rd from the end (before province/country)
  
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
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const categories = searchParams.getAll("category"); // Support multiple categories
    const cities = searchParams.getAll("city"); // Support multiple cities
    const remote = searchParams.get("remote");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Build where clause
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        companyName?: { contains: string; mode: "insensitive" };
        location?: { contains: string; mode: "insensitive" };
      }>;
      type?: { contains: string; mode: "insensitive" };
      category?: { contains: string; mode: "insensitive" };
      location?: { contains: string; mode: "insensitive" };
      isWfh?: boolean;
    } = {};
    
    // Search query
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { companyName: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }
    
    // Filter by type (normalize to handle both "Full-time" and "Full time" formats)
    // We'll filter after fetching since Prisma doesn't support complex string normalization
    const typeFilter = type ? type.replace(/[- ]/g, '').toLowerCase() : null;
    
    // Don't add type to Prisma where clause, we'll filter manually after fetch
    // This allows us to normalize both the filter and the database value for comparison
    
    // Filter by category (support multiple)
    // We'll filter manually after fetch for multiple categories
    const categoryFilter = categories.length > 0 ? categories : null;
    
    // Filter by remote
    if (remote === "true") {
      where.isWfh = true;
    }
    
    // Build where clause for Prisma (without city, category, and type filter, we'll filter manually)
    const prismaWhere: any = { ...where };
    if (categoryFilter) {
      // Remove category from Prisma where, we'll filter manually for multiple
      delete prismaWhere.category;
    }
    if (cities.length > 0) {
      // Remove location filter from Prisma where, we'll filter manually
      delete prismaWhere.location;
    }
    // Remove type from Prisma where since we'll normalize and filter manually
    if (typeFilter) {
      delete prismaWhere.type;
    }

    // Fetch jobs from database
    let jobs = await prisma.job.findMany({
      where: prismaWhere,
      include: {
        company: true,
        jobSkills: {
          take: 5, // Limit skills to 5
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by type if specified (normalize to handle both "Full-time" and "Full time" formats)
    if (typeFilter) {
      jobs = jobs.filter(job => {
        if (!job.type) return false;
        // Normalize job type: remove dashes and spaces, convert to lowercase
        const normalizedJobType = job.type.replace(/[- ]/g, '').toLowerCase();
        return normalizedJobType === typeFilter || normalizedJobType.includes(typeFilter);
      });
    }
    
    // Filter by category if specified (support multiple categories)
    if (categoryFilter && categoryFilter.length > 0) {
      jobs = jobs.filter(job => {
        if (!job.category) return false;
        return categoryFilter.some(cat => 
          job.category?.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }
    
    // Filter by city if specified (extract city from location, support multiple cities)
    if (cities.length > 0) {
      jobs = jobs.filter(job => {
        const jobCity = extractCityFromLocation(job.location);
        if (!jobCity) return false;
        return cities.some(city => 
          jobCity.toLowerCase().includes(city.toLowerCase())
        );
      });
    }

    // Get total count before pagination
    const total = jobs.length;

    // Apply pagination
    const paginatedJobs = jobs.slice(offset, offset + limit);

    // Transform to match JobFeed interface
    const transformedJobs = paginatedJobs.map((job) => ({
      id: job.id.toString(),
      title: job.title,
      company: job.companyName || job.company?.name || "Unknown Company",
      companyLogo: job.companyLogo || job.company?.logoSmall || "",
      location: job.location || "Location not specified",
      description: extractShortDescription(job.descriptionHtml || job.jobDescriptionRaw),
      matchScore: 85, // Default match score, can be calculated later
      type: job.tenure || job.type || "Full-time",
      posted: formatTimeAgo(job.activationDate || job.createdAt),
      salary: "Not specified", // Can be enhanced later
      url: `/jobs/${job.id}`,
      isHybrid: job.isHybrid || false,
      isWfh: job.isWfh || false,
      skills: job.jobSkills.map((skill) => skill.skillName),
    }));

    return NextResponse.json({
      jobs: transformedJobs,
      totalResults: total,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch jobs",
        jobs: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}

