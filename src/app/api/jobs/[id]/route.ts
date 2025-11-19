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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        jobSkills: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Transform to match frontend interface
    const transformedJob = {
      id: job.id.toString(),
      title: job.title,
      company: job.companyName || job.company?.name || "Unknown Company",
      companyLogo: job.companyLogo || job.company?.logoSmall || "",
      location: job.location || "Location not specified",
      description: job.descriptionHtml || job.jobDescriptionRaw || "No description available",
      qualifications: job.qualificationsHtml || "No qualifications specified",
      qualificationsHtml: job.qualificationsHtml || null,
      jobDescriptionRaw: job.jobDescriptionRaw || null,
      matchScore: 85, // Default, can be calculated later
      type: job.tenure || job.type || "Full-time",
      function: job.function || "",
      category: job.category || "",
      posted: formatTimeAgo(job.activationDate || job.createdAt),
      applicationEndDate: job.applicationEndDate,
      salary: "Not specified",
      url: `/jobs/${job.id}`,
      isHybrid: job.isHybrid || false,
      isWfh: job.isWfh || false,
      isOpenFreshGrads: job.isOpenFreshGrads || false,
      numberOfOpenings: job.numberOfOpenings || 1,
      minExperienceMonth: job.minExperienceMonth,
      openFreshGrad: job.openFreshGrad || false,
      skills: job.jobSkills.map((skill) => ({
        name: skill.skillName,
        type: skill.skillType || "hard",
      })),
      companyInfo: job.company ? {
        name: job.company.name,
        industry: job.company.industry,
        description: job.company.description,
        website: job.company.website,
        logo: job.company.logo || job.company.logoSmall,
      } : null,
      industry: job.industry || job.company?.industry,
      slug: job.slug,
      kalibrrJobId: job.kalibrrJobId,
    };

    return NextResponse.json(transformedJob);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

