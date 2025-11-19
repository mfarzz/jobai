import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get trending categories (top categories by job count)
    const categoryStats = await prisma.job.groupBy({
      by: ["category"],
      where: {
        category: {
          not: null,
        },
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
      take: 5,
    });

    // Get hot companies (companies with most jobs)
    const companyStats = await prisma.job.groupBy({
      by: ["companyName"],
      where: {
        companyName: {
          not: null,
        },
      },
      _count: {
        companyName: true,
      },
      orderBy: {
        _count: {
          companyName: "desc",
        },
      },
      take: 5,
    });

    // Get most demanded skills
    const skillStats = await prisma.jobSkill.groupBy({
      by: ["skillName"],
      _count: {
        skillName: true,
      },
      orderBy: {
        _count: {
          skillName: "desc",
        },
      },
      take: 10,
    });

    // Get job type statistics
    const remoteJobs = await prisma.job.count({
      where: { isWfh: true },
    });

    const hybridJobs = await prisma.job.count({
      where: { isHybrid: true },
    });

    const freshGradJobs = await prisma.job.count({
      where: { isOpenFreshGrads: true },
    });

    const totalJobs = await prisma.job.count();

    // Calculate trends (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentJobs = await prisma.job.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const previousJobs = await prisma.job.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const trendPercentage = previousJobs > 0
      ? Math.round(((recentJobs - previousJobs) / previousJobs) * 100)
      : 0;

    // Format trending categories with trend calculation
    const trendingCategoriesPromises = categoryStats.map(async (stat) => {
      const categoryName = stat.category || "Unknown";
      
      // Calculate trend for each category
      const [categoryRecent, categoryPrevious] = await Promise.all([
        prisma.job.count({
          where: {
            category: categoryName,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.job.count({
          where: {
            category: categoryName,
            createdAt: {
              gte: sixtyDaysAgo,
              lt: thirtyDaysAgo,
            },
          },
        }),
      ]);
      
      const categoryTrend = categoryPrevious > 0
        ? Math.round(((categoryRecent - categoryPrevious) / categoryPrevious) * 100)
        : categoryRecent > 0 ? 100 : 0;
      
      return {
        name: categoryName,
        count: `${stat._count.category.toLocaleString('id-ID')} jobs`,
        trend: categoryTrend > 0 ? `+${categoryTrend}%` : `${categoryTrend}%`,
        jobCount: stat._count.category,
      };
    });

    const trendingCategories = await Promise.all(trendingCategoriesPromises);

    // Format hot companies
    const hotCompanies = companyStats.map((stat) => ({
      name: stat.companyName || "Unknown Company",
      jobs: stat._count.companyName,
    }));

    // Get most demanded skill
    const mostDemandedSkill = skillStats.length > 0
      ? skillStats[0].skillName
      : "JavaScript";

    // Get top location
    const locationStats = await prisma.job.groupBy({
      by: ["location"],
      where: {
        location: {
          not: null,
        },
      },
      _count: {
        location: true,
      },
      orderBy: {
        _count: {
          location: "desc",
        },
      },
      take: 1,
    });

    const topLocation = locationStats.length > 0
      ? locationStats[0].location || "Jakarta"
      : "Jakarta";

    return NextResponse.json({
      trendingCategories,
      hotCompanies,
      marketInsights: {
        mostDemandedSkill,
        salaryGrowth: "+15%", // Can be calculated from actual data later
        topLocation: topLocation.includes("Jakarta") ? "Jakarta (Remote)" : topLocation,
        totalJobs,
        remoteJobs,
        hybridJobs,
        freshGradJobs,
      },
    });
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch job statistics" },
      { status: 500 }
    );
  }
}

