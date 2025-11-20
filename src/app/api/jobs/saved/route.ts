import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.savedJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            companyLogo: true,
            location: true,
            type: true,
            category: true,
            isWfh: true,
            isHybrid: true,
            shortDescription: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: saved.map((s) => ({
        id: s.id,
        jobId: s.jobId,
        createdAt: s.createdAt,
        job: s.job,
      })),
    });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved jobs" },
      { status: 500 }
    );
  }
}
