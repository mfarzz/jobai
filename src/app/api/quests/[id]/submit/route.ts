import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const parseXp = (str?: string | null, fallback = 0) => {
  if (!str) return fallback;
  const match = str.match(/\[xp:(\d+)\]/i);
  if (match) {
    const val = Number(match[1]);
    return Number.isNaN(val) ? fallback : val;
  }
  return fallback;
};

export async function POST(
  request: NextRequest,
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

    const questId = params?.id;
    if (!questId) {
      return NextResponse.json({ error: "Invalid quest id" }, { status: 400 });
    }
    const body = await request.json();
    const option = (body.option as string | undefined)?.toUpperCase();

    if (!option || !["A", "B", "C"].includes(option)) {
      return NextResponse.json(
        { error: "Invalid option. Use A, B, or C." },
        { status: 400 }
      );
    }

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    const xpMap: Record<string, number> = {
      A: parseXp(quest.optionA, quest.xpReward || 0),
      B: parseXp(quest.optionB, quest.xpReward || 0),
      C: parseXp(quest.optionC, quest.xpReward || 0),
    };

    const isCorrect =
      quest.correctOption?.toUpperCase() === option.toUpperCase();
    const xpEarned = xpMap[option] || 0;
    const explanationMap: Record<string, string | null | undefined> = {
      A: quest.explanationA,
      B: quest.explanationB,
      C: quest.explanationC,
    };
    const chosenExplanation =
      explanationMap[option] ||
      (isCorrect
        ? "Pilihanmu tepat sesuai konteks situasi."
        : "Pilihan lain lebih sejalan dengan kebutuhan kasus ini.");

    const existing = await prisma.userQuest.findFirst({
      where: { userId: session.user.id, questId },
    });

    let userQuest;
    if (existing) {
      userQuest = await prisma.userQuest.update({
        where: { id: existing.id },
        data: {
          status: isCorrect ? "completed" : "attempted",
          score: isCorrect ? 100 : 50,
          xpEarned,
          selectedOption: option,
          aiFeedback: chosenExplanation,
          completedAt: new Date(),
        },
      });
    } else {
      userQuest = await prisma.userQuest.create({
        data: {
          userId: session.user.id,
          questId,
          status: isCorrect ? "completed" : "attempted",
          score: isCorrect ? 100 : 50,
          xpEarned,
          selectedOption: option,
          aiFeedback: chosenExplanation,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      status: userQuest.status,
      xpEarned: userQuest.xpEarned,
      isCorrect,
      aiFeedback: userQuest.aiFeedback,
      selectedOption: userQuest.selectedOption,
      correctOption: quest.correctOption,
    });
  } catch (error) {
    console.error("Error submitting quest:", error);
    return NextResponse.json(
      { error: "Failed to submit quest" },
      { status: 500 }
    );
  }
}
