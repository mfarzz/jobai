import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const params =
      "params" in ctx && typeof (ctx as any).params?.then === "function"
        ? await (ctx as { params: Promise<{ id: string }> }).params
        : (ctx as { params: { id: string } }).params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = Number(params.id);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    });

    if (existing) {
      await prisma.savedJob.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedJob.create({
      data: { userId: session.user.id, jobId },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error toggling save job:", error);
    return NextResponse.json(
      { error: "Failed to toggle saved job" },
      { status: 500 }
    );
  }
}
