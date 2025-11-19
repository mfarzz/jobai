import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface KalibrrJob {
  id: number;
  name: string;
  function?: string;
  tenure?: string;
  company: {
    id: number;
    name: string;
    industry?: string;
    description?: string;
    logo_small?: string;
  };
  company_info?: {
    logo?: string;
    logo_small?: string;
    logo_medium?: string;
    url?: string;
    industry?: string;
    description?: string;
  };
  company_name: string;
  description?: string;
  qualifications?: string;
  google_location?: {
    address_components?: {
      address_line_1?: string;
      city?: string;
      country?: string;
      region?: string;
    };
  };
  activation_date?: string;
  application_end_date?: string;
  is_hybrid?: boolean;
  is_work_from_home?: boolean;
  is_open_to_fresh_grads?: boolean;
  number_of_openings?: number;
  work_experience?: number;
  slug?: string;
  visibility?: string;
  skills?: Array<{
    sds_skill?: {
      id: number;
      name: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, limit = 100, offset = 0 } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Fetch data from Kalibrr API
    const apiUrl = url.includes("?") 
      ? `${url}&limit=${limit}&offset=${offset}`
      : `${url}?limit=${limit}&offset=${offset}`;
    
    console.log("Fetching from:", apiUrl);
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    const jobs: KalibrrJob[] = data.jobs || [];

    if (!jobs.length) {
      return NextResponse.json({
        message: "No jobs found",
        imported: 0,
        skipped: 0,
        errors: 0,
      });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    // Process each job
    for (const jobData of jobs) {
      try {
        // Check if job already exists
        const existingJob = await prisma.job.findUnique({
          where: { kalibrrJobId: jobData.id },
        });

        if (existingJob) {
          skipped++;
          continue;
        }

        // Handle Company - create or find existing
        let company = await prisma.company.findFirst({
          where: { kalibrrCompanyId: jobData.company.id },
        });

        if (!company) {
          // Create new company
          company = await prisma.company.create({
            data: {
              kalibrrCompanyId: jobData.company.id,
              name: jobData.company.name.substring(0, 200),
              industry: jobData.company_info?.industry || jobData.company.industry || null,
              description: jobData.company_info?.description || jobData.company.description || null,
              website: jobData.company_info?.url || null,
              logo: jobData.company_info?.logo || null,
              logoSmall: jobData.company_info?.logo_small || jobData.company.logo_small || null,
              logoMedium: jobData.company_info?.logo_medium || null,
            },
          });
        } else {
          // Update company if needed
          company = await prisma.company.update({
            where: { id: company.id },
            data: {
              name: jobData.company.name.substring(0, 200),
              industry: jobData.company_info?.industry || jobData.company.industry || company.industry,
              description: jobData.company_info?.description || jobData.company.description || company.description,
              website: jobData.company_info?.url || company.website,
              logo: jobData.company_info?.logo || company.logo,
              logoSmall: jobData.company_info?.logo_small || jobData.company.logo_small || company.logoSmall,
              logoMedium: jobData.company_info?.logo_medium || company.logoMedium,
            },
          });
        }

        // Build location string
        const locationParts = jobData.google_location?.address_components;
        const location = locationParts
          ? [
              locationParts.address_line_1,
              locationParts.city,
              locationParts.region,
              locationParts.country,
            ]
            .filter(Boolean)
            .join(", ")
          : null;

        // Parse dates
        const activationDate = jobData.activation_date
          ? new Date(jobData.activation_date)
          : null;
        const applicationEndDate = jobData.application_end_date
          ? new Date(jobData.application_end_date)
          : null;

        // Create job
        const job = await prisma.job.create({
          data: {
            kalibrrJobId: jobData.id,
            title: jobData.name.substring(0, 200),
            function: jobData.function?.substring(0, 150) || null,
            category: jobData.function?.substring(0, 150) || null,
            type: jobData.tenure?.substring(0, 80) || null,
            tenure: jobData.tenure?.substring(0, 100) || null,
            companyId: company.id,
            companyName: jobData.company_name?.substring(0, 200) || null,
            companyLogo: jobData.company_info?.logo_small || jobData.company.logo_small || null,
            industry: jobData.company_info?.industry || jobData.company.industry || null,
            location: location?.substring(0, 300) || null,
            activationDate: activationDate,
            applicationEndDate: applicationEndDate,
            isHybrid: jobData.is_hybrid || false,
            isWfh: jobData.is_work_from_home || false,
            isOpenFreshGrads: jobData.is_open_to_fresh_grads || false,
            numberOfOpenings: jobData.number_of_openings || null,
            descriptionHtml: jobData.description?.substring(0, 50000) || null,
            qualificationsHtml: jobData.qualifications?.substring(0, 50000) || null,
            jobDescriptionRaw: jobData.description || null,
            minExperienceMonth: jobData.work_experience || null,
            openFreshGrad: jobData.is_open_to_fresh_grads || false,
            slug: jobData.slug?.substring(0, 200) || null,
            visibility: jobData.visibility?.substring(0, 50) || null,
          },
        });

        // Handle skills
        if (jobData.skills && jobData.skills.length > 0) {
          const skillData = jobData.skills
            .filter((skill) => skill.sds_skill)
            .map((skill) => ({
              jobId: job.id,
              skillName: skill.sds_skill!.name.substring(0, 150),
              skillType: "hard" as const, // Default to hard skill, can be enhanced later
            }));

          if (skillData.length > 0) {
            await prisma.jobSkill.createMany({
              data: skillData,
              skipDuplicates: true,
            });
          }
        }

        imported++;
      } catch (error: unknown) {
        errors++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errorMessages.push(
          `Job ID ${jobData.id}: ${errorMessage}`
        );
        console.error(`Error processing job ${jobData.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Import completed",
      imported,
      skipped,
      errors,
      totalProcessed: jobs.length,
      errorMessages: errorMessages.slice(0, 10), // Limit to first 10 errors
    });
  } catch (error: unknown) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to import jobs",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
