import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const cleanJson = (text: string) =>
  text.replace(/```json/gi, "").replace(/```/g, "").trim();
const parseXpValue = (str?: string | null) => {
  if (!str) return 0;
  const match = str.match(/\[xp:(\d+)\]/i);
  return match ? Number(match[1]) : 0;
};

function buildPrompt(params: {
  jobTitle: string;
  jobDescription?: string | null;
  jobQualifications?: string | null;
  jobSkills: string[];
  scenarioFocus?: string;
}) {
  const { jobTitle, jobDescription, jobQualifications, jobSkills, scenarioFocus } = params;
  return `
Buat 1 simulasi quest untuk role "${jobTitle}". Format JSON saja (tanpa teks lain).
Struktur JSON:
{
  "question": "pertanyaan situasional/teknis singkat",
  "options": [
    {"label":"A","text":"jawaban", "xp": int, "explanation": "alasan singkat"},
    {"label":"B","text":"jawaban", "xp": int, "explanation": "alasan singkat"},
    {"label":"C","text":"jawaban", "xp": int, "explanation": "alasan singkat"}
  ],
  "answer": "A/B/C sebagai opsi terbaik"
}
Aturan:
- Sesuaikan konteks dengan job description/requirements berikut.
- Fokus tema: ${scenarioFocus || "beri variasi skenario yang berbeda (situasional, teknis, prioritas)"}.
- Tiap opsi punya XP berbeda (10-100). Jangan sama.
- Satu jawaban terbaik saja (answer).
- Tambahkan explanation per opsi (1-2 kalimat) jelaskan kenapa opsi itu benar/kurang tepat.
- Bahasa Indonesia, ringkas, relevan dengan role.

Job description:
${jobDescription || "-"}

Qualifications:
${jobQualifications || "-"}

Skills penting: ${jobSkills.join(", ") || "-"}
`;
}

async function generateQuest({
  jobTitle,
  jobDescription,
  jobQualifications,
  jobSkills,
  scenarioFocus,
}: {
  jobTitle: string;
  jobDescription?: string | null;
  jobQualifications?: string | null;
  jobSkills: string[];
  scenarioFocus?: string;
}) {
  const prompt = buildPrompt({
    jobTitle,
    jobDescription,
    jobQualifications,
    jobSkills,
    scenarioFocus,
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
  });
  const response = await model.generateContent(prompt);
  let text = response.response.text();
  text = cleanJson(text);
  const parsed = JSON.parse(text);

  const options = Array.isArray(parsed.options) ? parsed.options : [];
  const validOptions = options
    .filter(
      (o) =>
        ["A", "B", "C"].includes(o.label) &&
        typeof o.text === "string" &&
        typeof o.xp === "number"
    )
    .slice(0, 3);

  if (!parsed.question || validOptions.length < 3 || !parsed.answer) {
    throw new Error("Format quest dari AI tidak valid");
  }

  const explanations: Record<string, string> = {};
  validOptions.forEach((opt) => {
    if (opt.explanation && typeof opt.explanation === "string") {
      explanations[opt.label] = opt.explanation;
    }
  });

  return {
    question: parsed.question as string,
    options: validOptions as Array<{
      label: "A" | "B" | "C";
      text: string;
      xp: number;
      explanation?: string;
    }>,
    answer: parsed.answer as "A" | "B" | "C",
    explanations,
  };
}

function serializeOption(option: { label: string; text: string; xp: number }) {
  return `[xp:${option.xp}] ${option.text}`;
}

const questThemes = [
  "Prioritas & manajemen pekerjaan",
  "Pengambilan keputusan teknis cepat",
  "Kolaborasi tim & koordinasi lintas fungsi",
  "Layanan/komunikasi ke pelanggan",
  "Risiko, keamanan, atau kepatuhan",
];

const pickThemes = (count: number) =>
  questThemes
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

export async function GET(
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

    const jobId = Number(params.id);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const requestedCount = Number(request.nextUrl.searchParams.get("count"));
    const takeCount = Number.isNaN(requestedCount)
      ? 3
      : Math.min(3, Math.max(1, requestedCount));

    const quests = await prisma.quest.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      take: takeCount,
    });

    if (!quests.length) {
      return NextResponse.json({ quest: null, quests: [], userQuests: [] });
    }

    const questIds = quests.map((q) => q.id);
    const userQuests = await prisma.userQuest.findMany({
      where: { userId: session.user.id, questId: { in: questIds } },
      orderBy: { completedAt: "desc" },
    });
    const userQuestMap = new Map(userQuests.map((uq) => [uq.questId, uq]));

    const questDtos = quests.map((quest) => ({
      id: quest.id,
      question: quest.scenario || "",
      options: [
        { label: "A", text: quest.optionA || "", xp: parseXpValue(quest.optionA) },
        { label: "B", text: quest.optionB || "", xp: parseXpValue(quest.optionB) },
        { label: "C", text: quest.optionC || "", xp: parseXpValue(quest.optionC) },
      ],
      correctOption: quest.correctOption,
      explanations: {
        A: quest.explanationA,
        B: quest.explanationB,
        C: quest.explanationC,
      },
      jobId: quest.jobId,
      createdAt: quest.createdAt,
    }));

    const userQuestDtos = questDtos
      .map((quest) => {
        const uq = userQuestMap.get(quest.id);
        if (!uq) return null;
        return {
          questId: quest.id,
          status: uq.status,
          xpEarned: uq.xpEarned,
          isCorrect: uq.status === "completed",
          aiFeedback: uq.aiFeedback,
          selectedOption: uq.selectedOption,
          correctOption: quest.correctOption,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      quest: questDtos[0] || null,
      quests: questDtos,
      userQuests: userQuestDtos,
    });
  } catch (error) {
    console.error("Error fetching quest:", error);
    return NextResponse.json(
      { error: "Failed to fetch quest" },
      { status: 500 }
    );
  }
}

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

    const jobId = Number(params.id);
    if (Number.isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { jobSkills: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const requestedCount = Number(request.nextUrl.searchParams.get("count"));
    const batchCount = Number.isNaN(requestedCount)
      ? 3
      : Math.min(3, Math.max(1, requestedCount));

    const themes = pickThemes(batchCount);
    const generatedQuests = await Promise.all(
      themes.map((theme) =>
        generateQuest({
          jobTitle: job.title,
          jobDescription: job.shortDescription || job.descriptionHtml || "",
          jobQualifications: job.qualificationsHtml || "",
          jobSkills: job.jobSkills.map((s) => s.skillName),
          scenarioFocus: theme,
        })
      )
    );

    const createdQuests = await Promise.all(
      generatedQuests.map((questGen) =>
        prisma.quest.create({
          data: {
            jobId,
            title: `Simulasi: ${job.title}`,
            scenario: questGen.question,
            optionA: serializeOption(
              questGen.options.find((o) => o.label === "A")!
            ),
            optionB: serializeOption(
              questGen.options.find((o) => o.label === "B")!
            ),
            optionC: serializeOption(
              questGen.options.find((o) => o.label === "C")!
            ),
            explanationA: questGen.explanations?.A || null,
            explanationB: questGen.explanations?.B || null,
            explanationC: questGen.explanations?.C || null,
            correctOption: questGen.answer,
            xpReward: Math.max(...questGen.options.map((o) => o.xp)),
            generatedByAi: true,
          },
        })
      )
    );

    const questsPayload = createdQuests.map((quest, idx) => ({
      id: quest.id,
      question: quest.scenario,
      options: generatedQuests[idx].options,
      correctOption: quest.correctOption,
      explanations: generatedQuests[idx].explanations,
      jobId: quest.jobId,
      createdAt: quest.createdAt,
    }));

    return NextResponse.json({
      quest: questsPayload[0],
      quests: questsPayload,
    });
  } catch (error) {
    console.error("Error generating quest:", error);
    return NextResponse.json(
      { error: "Failed to generate simulation" },
      { status: 500 }
    );
  }
}
