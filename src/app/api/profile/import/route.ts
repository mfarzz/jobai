import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const extractionSchema = z.object({
  skills: z.array(z.string().min(1)).default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1),
        issuer: z.string().optional().nullable(),
        issueDate: z.string().optional().nullable(),
        expiryDate: z.string().optional().nullable(),
        credentialId: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
      })
    )
    .default([]),
  experiences: z
    .array(
      z.object({
        title: z.string().optional().nullable(), // izinkan kosong lalu difilter
        company: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        current: z.boolean().optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().optional().nullable(), // izinkan kosong lalu difilter
        description: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().optional().nullable(), // izinkan kosong lalu difilter
        degree: z.string().optional().nullable(),
        field: z.string().optional().nullable(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        current: z.boolean().optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .default([]),
});

type ExtractedCv = z.infer<typeof extractionSchema>;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const cleanJsonOutput = (raw: string) =>
  raw.replace(/```json/gi, "").replace(/```/g, "").trim();

async function extractWithGemini(fileBuffer: Buffer, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diset. Tambahkan key untuk ekstraksi CV."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
  });

  const prompt = `
  Ekstrak CV ini dan kembalikan JSON saja (tanpa penjelasan) dengan struktur:
  {
    "skills": [string],
    "certifications": [{"name": string, "issuer": string?, "issueDate": "YYYY-MM-DD"?, "expiryDate": "YYYY-MM-DD"?, "credentialId": string?, "url": string?}],
    "experiences": [{"title": string, "company": string?, "location": string?, "startDate": "YYYY-MM-DD"?, "endDate": "YYYY-MM-DD"?, "current": boolean?, "description": string?}],
    "projects": [{"name": string, "description": string?, "startDate": "YYYY-MM-DD"?, "endDate": "YYYY-MM-DD"?, "url": string?}],
    "education": [{"school": string, "degree": string?, "field": string?, "startDate": "YYYY-MM-DD"?, "endDate": "YYYY-MM-DD"?, "current": boolean?, "description": string?}]
  }
  Gunakan tanggal ISO jika bisa. Jangan sertakan teks lain.
  `;

  const response = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType || "application/octet-stream",
      },
    },
  ]);

  const rawText = response.response.text();
  const parsed = JSON.parse(cleanJsonOutput(rawText));
  return extractionSchema.parse(parsed);
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "File CV wajib diunggah pada field 'file' (form-data)" },
        { status: 400 }
      );
    }

    if ((file as File).size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Maksimal ukuran file 10MB" },
        { status: 413 }
      );
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = (file as File).type || "application/octet-stream";

    const extracted = await extractWithGemini(buffer, mimeType);

    const userId = session.user.id;

    // Bersihkan entri kosong sebelum simpan
    const cleanedExperiences = extracted.experiences.filter(
      (exp) => exp.title && exp.title.trim() && exp.company && exp.company.trim()
    );
    const cleanedProjects = extracted.projects.filter(
      (proj) => proj.name && proj.name.trim()
    );
    const cleanedEducation = extracted.education.filter(
      (edu) => edu.school && edu.school.trim()
    );
    const cleanedCertifications = extracted.certifications.filter(
      (cert) => cert.name && cert.name.trim()
    );

    // Skills: dedupe + skip existing
    const existingSkills = await prisma.userSkill.findMany({
      where: { userId },
      select: { skillName: true },
    });
    const existingSkillSet = new Set(
      existingSkills.map((s) => s.skillName.toLowerCase())
    );
    const skillPayload = dedupeStrings(extracted.skills).filter(
      (skill) => !existingSkillSet.has(skill.toLowerCase())
    );
    if (skillPayload.length > 0) {
      await prisma.userSkill.createMany({
        data: skillPayload.map((skillName) => ({ userId, skillName })),
        skipDuplicates: true,
      });
    }

    // Experiences
    const expPayload = cleanedExperiences.map((exp) => ({
      userId,
      title: exp.title,
      company: exp.company ?? "Unknown",
      location: exp.location ?? null,
      startDate: parseDate(exp.startDate) ?? new Date(),
      endDate: parseDate(exp.endDate),
      current: Boolean(exp.current),
      description: exp.description ?? null,
    }));
    if (expPayload.length > 0) {
      await prisma.userExperience.createMany({ data: expPayload });
    }

    // Projects
    const projectPayload = cleanedProjects.map((proj) => ({
      userId,
      name: proj.name,
      description: proj.description ?? null,
      startDate: parseDate(proj.startDate),
      endDate: parseDate(proj.endDate),
      url: proj.url ?? null,
    }));
    if (projectPayload.length > 0) {
      await prisma.userProject.createMany({ data: projectPayload });
    }

    // Education
    const educationPayload = cleanedEducation.map((edu) => ({
      userId,
      school: edu.school,
      degree: edu.degree ?? null,
      field: edu.field ?? null,
      startDate: parseDate(edu.startDate),
      endDate: parseDate(edu.endDate),
      current: Boolean(edu.current),
      description: edu.description ?? null,
    }));
    if (educationPayload.length > 0) {
      await prisma.userEducation.createMany({ data: educationPayload });
    }

    // Certifications
    const certPayload = cleanedCertifications.map((cert) => ({
      userId,
      name: cert.name,
      issuer: cert.issuer ?? "Unknown",
      issueDate: parseDate(cert.issueDate) ?? new Date(),
      expiryDate: parseDate(cert.expiryDate),
      credentialId: cert.credentialId ?? null,
      url: cert.url ?? null,
    }));
    if (certPayload.length > 0) {
      await prisma.userCertification.createMany({ data: certPayload });
    }

    const result = {
      skills: skillPayload.length,
      experiences: expPayload.length,
      projects: projectPayload.length,
      educations: educationPayload.length,
      certifications: certPayload.length,
    };

    return NextResponse.json({
      message: "Berhasil impor CV. File tidak disimpan.",
      inserted: result,
      extracted,
    });
  } catch (error) {
    console.error("Error importing CV:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memproses CV";
    return NextResponse.json(
      { error: "Failed to import CV", details: message },
      { status: 500 }
    );
  }
}
