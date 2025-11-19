import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SkillGap {
  missing: Array<{ skill: string; importance: string }>;
  existing: Array<{ skill: string; level: string }>;
}

interface AnalysisResult {
  matchScore: number;
  skillGap: SkillGap;
  recommendation: string;
}

async function analyzeJobMatch(
  userProfile: {
    skills: Array<{ skillName: string; level: number | null }>;
    experiences: Array<{ 
      title: string; 
      company: string; 
      location: string | null;
      startDate: Date;
      endDate: Date | null;
      current: boolean;
      description: string | null;
    }>;
    educations: Array<{ 
      school: string; 
      degree: string | null; 
      field: string | null;
      startDate: Date | null;
      endDate: Date | null;
      current: boolean;
      description: string | null;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate: Date | null;
    }>;
    projects: Array<{
      name: string;
      description: string | null;
      startDate: Date | null;
      endDate: Date | null;
      url: string | null;
    }>;
  },
  jobData: {
    title: string;
    description: string;
    qualifications: string;
    skills: Array<{ skillName: string }>;
  }
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Format experiences
    const experiencesText = userProfile.experiences.map(e => {
      const duration = e.current 
        ? `sejak ${new Date(e.startDate).getFullYear()} (masih berlangsung)`
        : `${new Date(e.startDate).getFullYear()} - ${e.endDate ? new Date(e.endDate).getFullYear() : 'sekarang'}`;
      return `${e.title} di ${e.company}${e.location ? ` (${e.location})` : ''} (${duration})${e.description ? `: ${e.description.substring(0, 200)}` : ''}`;
    }).join('\n');

    // Format educations
    const educationsText = userProfile.educations.map(e => {
      const degreeField = [e.degree, e.field].filter(Boolean).join(' ');
      const duration = e.current 
        ? `sedang berlangsung`
        : `${e.startDate && e.endDate ? `${new Date(e.startDate).getFullYear()} - ${new Date(e.endDate).getFullYear()}` : ''}`;
      return `${degreeField} dari ${e.school}${duration ? ` (${duration})` : ''}${e.description ? `: ${e.description.substring(0, 150)}` : ''}`;
    }).join('\n');

    // Format certifications
    const certificationsText = userProfile.certifications.map(c => {
      const expiry = c.expiryDate ? ` (berlaku hingga ${new Date(c.expiryDate).getFullYear()})` : '';
      return `${c.name} dari ${c.issuer} (${new Date(c.issueDate).getFullYear()})${expiry}`;
    }).join('\n');

    // Format projects
    const projectsText = userProfile.projects.map(p => {
      return `${p.name}${p.description ? `: ${p.description.substring(0, 200)}` : ''}`;
    }).join('\n');

    const prompt = `Anda adalah seorang career advisor yang ahli dalam menganalisis kecocokan kandidat dengan lowongan kerja. Analisis harus mempertimbangkan SEMUA aspek profil kandidat secara komprehensif.

DATA PROFIL KANDIDAT:

1. SKILLS (${userProfile.skills.length} skills):
${userProfile.skills.map(s => `- ${s.skillName} (level: ${s.level || 'N/A'})`).join('\n')}

2. PENGALAMAN KERJA (${userProfile.experiences.length} pengalaman):
${experiencesText || 'Tidak ada pengalaman kerja'}

3. PENDIDIKAN (${userProfile.educations.length} pendidikan):
${educationsText || 'Tidak ada data pendidikan'}

4. SERTIFIKASI (${userProfile.certifications.length} sertifikasi):
${certificationsText || 'Tidak ada sertifikasi'}

5. PROYEK (${userProfile.projects.length} proyek):
${projectsText || 'Tidak ada proyek'}

DATA LOWONGAN KERJA:
- Posisi: ${jobData.title}
- Deskripsi: ${jobData.description.substring(0, 1500)}
- Kualifikasi: ${jobData.qualifications.substring(0, 1500)}
- Skills yang Dibutuhkan: ${jobData.skills.map(s => s.skillName).join(', ')}

TUGAS ANDA:
Analisis kecocokan kandidat dengan mempertimbangkan:
1. Skills matching (apakah skills kandidat sesuai dengan requirements)
2. Pengalaman kerja (relevansi pengalaman dengan posisi)
3. Pendidikan (apakah latar belakang pendidikan sesuai)
4. Sertifikasi (apakah sertifikasi relevan dan menambah nilai)
5. Proyek (apakah proyek yang pernah dikerjakan relevan)

Berikan respons dalam format JSON berikut:
{
  "matchScore": <angka 0-100 berdasarkan analisis komprehensif semua aspek>,
  "skillGap": {
    "missing": [{"skill": "nama skill dari job requirements yang TIDAK dimiliki kandidat", "importance": "high/medium/low"}],
    "existing": [{"skill": "nama skill yang dimiliki kandidat DAN juga ada di job requirements (HANYA yang match/relevan)", "level": "expert/intermediate/beginner"}]
  },
  "recommendation": "Rekomendasi lengkap dalam bahasa Indonesia menggunakan format HTML yang terstruktur dan rapi. Format harus menggunakan HTML tags berikut: <h3> untuk judul section, <p> untuk paragraf, <ul> dan <li> untuk list, <strong> untuk teks penting, <em> untuk penekanan. Struktur harus mencakup: (1) Ringkasan evaluasi keseluruhan kecocokan, (2) Section 'Kelebihan Kandidat' dengan bullet points, (3) Section 'Area yang Perlu Ditingkatkan' dengan bullet points, (4) Section 'Langkah-langkah Konkret' dengan numbered list, dan (5) Section 'Timeline Persiapan' dengan timeline yang jelas. Minimal 400 kata. Gunakan class HTML yang sesuai untuk styling."
}

Contoh struktur HTML yang diinginkan:
<h3>Ringkasan Evaluasi</h3>
<p>Secara keseluruhan, kandidat ini menunjukkan...</p>

<h3>Kelebihan Kandidat</h3>
<ul>
  <li><strong>Pengalaman Praktis:</strong> Deskripsi kelebihan</li>
  <li><strong>Portofolio Kuat:</strong> Deskripsi kelebihan</li>
</ul>

<h3>Area yang Perlu Ditingkatkan</h3>
<ul>
  <li>Area 1 dengan penjelasan</li>
  <li>Area 2 dengan penjelasan</li>
</ul>

<h3>Langkah-langkah Konkret</h3>
<ol>
  <li><strong>Judul Langkah:</strong> Penjelasan detail</li>
  <li><strong>Judul Langkah:</strong> Penjelasan detail</li>
</ol>

<h3>Timeline Persiapan</h3>
<ul>
  <li><strong>1-2 bulan:</strong> Fokus pada...</li>
  <li><strong>2-3 bulan:</strong> Menerapkan...</li>
</ul>

Pastikan respons hanya berisi JSON yang valid, tanpa teks tambahan.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").replace(/```\n?/g, "");
    }

    const analysis: AnalysisResult = JSON.parse(jsonText);

    // Validate and ensure matchScore is between 0-100
    analysis.matchScore = Math.max(0, Math.min(100, analysis.matchScore || 0));

    return analysis;
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    
    // Fallback: Comprehensive calculation based on all aspects
    const jobSkills = jobData.skills.map(s => s.skillName.toLowerCase());
    const userSkillsList = userProfile.skills.map(s => s.skillName.toLowerCase());
    
    // Skill matching (40% weight)
    const matchedSkills = jobSkills.filter(skill => 
      userSkillsList.some(us => us.includes(skill) || skill.includes(us))
    );
    const skillScore = (matchedSkills.length / Math.max(jobSkills.length, 1)) * 40;
    
    // Experience relevance (25% weight) - check if experiences are relevant
    const experienceScore = userProfile.experiences.length > 0 ? 25 : 10;
    
    // Education relevance (15% weight)
    const educationScore = userProfile.educations.length > 0 ? 15 : 5;
    
    // Certifications (10% weight)
    const certificationScore = userProfile.certifications.length > 0 ? 10 : 0;
    
    // Projects (10% weight)
    const projectScore = userProfile.projects.length > 0 ? 10 : 0;
    
    const matchScore = Math.round(skillScore + experienceScore + educationScore + certificationScore + projectScore);
    
    const missingSkills = jobSkills
      .filter(skill => !userSkillsList.some(us => us.includes(skill) || skill.includes(us)))
      .map(skill => ({ skill, importance: "medium" as const }));
    
    // Only show existing skills that match job requirements
    const existingSkills = userProfile.skills
      .filter(userSkill => {
        const userSkillLower = userSkill.skillName.toLowerCase();
        return jobSkills.some(jobSkill => 
          userSkillLower.includes(jobSkill) || jobSkill.includes(userSkillLower)
        );
      })
      .map(userSkill => {
        // Find matching job skill to get the actual job skill name
        const matchedJobSkill = jobSkills.find(js => 
          userSkill.skillName.toLowerCase().includes(js) || 
          js.includes(userSkill.skillName.toLowerCase())
        );
        return { 
          skill: matchedJobSkill || userSkill.skillName, 
          level: userSkill.level && userSkill.level >= 70 ? "expert" : userSkill.level && userSkill.level >= 50 ? "intermediate" : "beginner" as const
        };
      });

    const strengths = [];
    if (userProfile.experiences.length > 0) strengths.push('Memiliki pengalaman kerja yang relevan');
    if (userProfile.educations.length > 0) strengths.push('Memiliki latar belakang pendidikan yang sesuai');
    if (userProfile.certifications.length > 0) strengths.push('Memiliki sertifikasi yang relevan');
    if (userProfile.projects.length > 0) strengths.push('Memiliki portofolio proyek yang kuat');

    const recommendation = `<h3>Ringkasan Evaluasi</h3>
<p>Berdasarkan analisis komprehensif profil Anda (skills, pengalaman, pendidikan, sertifikasi, dan proyek), Anda memiliki <strong>${matchScore}% kecocokan</strong> dengan posisi ini.</p>

<h3>Kelebihan Kandidat</h3>
<ul>
${strengths.map(s => `<li>${s}</li>`).join('')}
${existingSkills.length > 0 ? `<li><strong>Skills yang Dikuasai:</strong> ${existingSkills.slice(0, 5).map(s => s.skill).join(', ')}</li>` : ''}
</ul>

<h3>Area yang Perlu Ditingkatkan</h3>
<ul>
${missingSkills.slice(0, 5).map(s => `<li><strong>${s.skill}</strong> - Skill ini penting untuk posisi ini. Fokus pada pembelajaran dan praktik.</li>`).join('')}
</ul>

<h3>Langkah-langkah Konkret</h3>
<ol>
<li><strong>Pembelajaran Skill yang Kurang:</strong> Fokus pada skill: ${missingSkills.slice(0, 3).map(s => s.skill).join(', ')}. Tingkatkan melalui kursus online, tutorial, dan praktik langsung.</li>
<li><strong>Proyek Pribadi:</strong> Buat proyek yang menggunakan skill yang kurang untuk membuktikan kemampuan Anda.</li>
<li><strong>Sertifikasi:</strong> Pertimbangkan untuk mengambil sertifikasi yang relevan dengan posisi ini.</li>
</ol>

<h3>Timeline Persiapan</h3>
<ul>
<li><strong>1-2 bulan:</strong> Fokus pada pembelajaran skill yang kurang melalui kursus online dan praktik.</li>
<li><strong>2-3 bulan:</strong> Menerapkan skill yang dipelajari dalam proyek pribadi dan dokumentasikan hasilnya.</li>
<li><strong>3-6 bulan:</strong> Menyempurnakan skill, membangun portofolio yang lebih kuat, dan siap untuk melamar.</li>
</ul>`;

    return {
      matchScore: Math.min(100, matchScore),
      skillGap: {
        missing: missingSkills,
        existing: existingSkills,
      },
      recommendation,
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Fetch user profile data - ALL aspects
    const [userSkills, userExperiences, userEducations, userCertifications, userProjects] = await Promise.all([
      prisma.userSkill.findMany({
        where: { userId: session.user.id },
      }),
      prisma.userExperience.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" },
      }),
      prisma.userEducation.findMany({
        where: { userId: session.user.id },
        orderBy: { startDate: "desc" },
      }),
      prisma.userCertification.findMany({
        where: { userId: session.user.id },
        orderBy: { issueDate: "desc" },
      }),
      prisma.userProject.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Fetch job data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobSkills: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Prepare data for analysis - ALL aspects
    const userProfile = {
      skills: userSkills,
      experiences: userExperiences,
      educations: userEducations,
      certifications: userCertifications,
      projects: userProjects,
    };

    const jobData = {
      title: job.title,
      description: job.descriptionHtml || job.jobDescriptionRaw || "",
      qualifications: job.qualificationsHtml || "",
      skills: job.jobSkills,
    };

    // Perform analysis
    const analysis = await analyzeJobMatch(userProfile, jobData);

    // Save or update analysis in database
    const careerAnalysis = await prisma.careerAnalysis.upsert({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: jobId,
        },
      },
      create: {
        userId: session.user.id,
        jobId: jobId,
        matchScore: analysis.matchScore,
        skillGap: JSON.stringify(analysis.skillGap),
        aiRecommendation: analysis.recommendation,
      },
      update: {
        matchScore: analysis.matchScore,
        skillGap: JSON.stringify(analysis.skillGap),
        aiRecommendation: analysis.recommendation,
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: careerAnalysis.id,
      matchScore: analysis.matchScore,
      skillGap: analysis.skillGap,
      recommendation: analysis.recommendation,
      analyzedAt: careerAnalysis.analyzedAt,
    });
  } catch (error) {
    console.error("Error analyzing job match:", error);
    return NextResponse.json(
      { error: "Failed to analyze job match" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Fetch existing analysis
    const analysis = await prisma.careerAnalysis.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: jobId,
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: analysis.id,
      matchScore: analysis.matchScore,
      skillGap: analysis.skillGap ? JSON.parse(analysis.skillGap) : null,
      recommendation: analysis.aiRecommendation,
      analyzedAt: analysis.analyzedAt,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

