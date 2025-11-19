/**
 * Script to import jobs from Kalibrr API
 * 
 * Usage:
 *   npx tsx scripts/import-kalibrr-jobs.ts <API_URL> [limit] [offset]
 * 
 * Example:
 *   npx tsx scripts/import-kalibrr-jobs.ts "https://www.kalibrr.id/kjs/job_board/search?limit=100&offset=0"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function importJobs(apiUrl: string) {
  try {
    console.log("Fetching jobs from:", apiUrl);
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

    console.log(`Found ${jobs.length} jobs to process`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

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

        // Handle Company
        let company = await prisma.company.findFirst({
          where: { kalibrrCompanyId: jobData.company.id },
        });

        if (!company) {
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
        }

        // Build location
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
              skillType: "hard" as const,
            }));

          if (skillData.length > 0) {
            await prisma.jobSkill.createMany({
              data: skillData,
              skipDuplicates: true,
            });
          }
        }

        imported++;
        if (imported % 10 === 0) {
          console.log(`Processed ${imported + skipped + errors}/${jobs.length} jobs...`);
        }
      } catch (error: unknown) {
        errors++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing job ${jobData.id}:`, errorMessage);
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total jobs: ${jobs.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error: unknown) {
    console.error("Import error:", error);
    throw error;
  }
}

// Main execution
const apiUrl = process.argv[2];
if (!apiUrl) {
  console.error("Usage: npx tsx scripts/import-kalibrr-jobs.ts <API_URL>");
  console.error('Example: npx tsx scripts/import-kalibrr-jobs.ts "https://www.kalibrr.id/kjs/job_board/search?limit=100&offset=0"');
  process.exit(1);
}

importJobs(apiUrl)
  .then(() => {
    console.log("\nImport completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nImport failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
