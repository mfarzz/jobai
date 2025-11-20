"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopNav } from "@/app/components/TopNav";
import { Footer } from "@/app/components/Footer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  Briefcase,
  Building2,
  Globe,
  Send,
  ArrowLeft,
  Loader2,
  Code,
  Users,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Edit,
} from "lucide-react";
import Link from "next/link";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  description: string;
  qualifications: string;
  qualificationsHtml?: string;
  jobDescriptionRaw?: string;
  matchScore: number;
  type: string;
  function: string;
  category: string;
  posted: string;
  applicationEndDate: string | null;
  salary: string;
  url: string;
  isHybrid: boolean;
  isWfh: boolean;
  isOpenFreshGrads: boolean;
  numberOfOpenings: number | null;
  minExperienceMonth: number | null;
  openFreshGrad: boolean;
  skills: Array<{ name: string; type: string }>;
  companyInfo: {
    name: string;
    industry: string | null;
    description: string | null;
    website: string | null;
    logo: string | null;
  } | null;
  industry: string | null;
  isSaved?: boolean;
}


interface CareerAnalysis {
  id: string;
  matchScore: number;
  skillGap: {
    missing: Array<{ skill: string; importance: string }>;
    existing: Array<{ skill: string; level: string }>;
  };
  recommendation: string;
  analyzedAt: string;
}

interface QuestOption {
  label: "A" | "B" | "C";
  text: string;
  xp: number;
}

interface QuestData {
  id: string;
  question: string;
  options: QuestOption[];
  correctOption?: string | null;
  explanations?: Record<string, string | null | undefined>;
}

interface QuestResult {
  status: string | null;
  xpEarned: number | null;
  isCorrect: boolean | null;
  aiFeedback?: string | null;
  selectedOption?: string | null;
  correctOption?: string | null;
}

const createEmptyResult = (): QuestResult => ({
  status: null,
  xpEarned: null,
  isCorrect: null,
  aiFeedback: null,
  selectedOption: null,
  correctOption: null,
});

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [questLoading, setQuestLoading] = useState(false);
  const [questError, setQuestError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<QuestResult>(() =>
    createEmptyResult()
  );
  const [submitting, setSubmitting] = useState(false);
  const [showQuestOverlay, setShowQuestOverlay] = useState(false);
  const analysisRef = useRef<HTMLDivElement | null>(null);
  const questRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [highlightedSection, setHighlightedSection] = useState<
    "analysis" | "quest" | null
  >(null);
  const currentQuest = quests[currentQuestIndex] || null;
  const totalQuests = quests.length;
  const completedCount = completedQuestIds.length;
  const isLastQuest = totalQuests > 0 && currentQuestIndex === totalQuests - 1;
  const progressLabel = totalQuests
    ? `Soal ${currentQuestIndex + 1} dari ${totalQuests} • ${completedCount}/${totalQuests} selesai`
    : null;

  const focusSection = (section: "analysis" | "quest") => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    const targetRef = section === "analysis" ? analysisRef : questRef;
    requestAnimationFrame(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    setHighlightedSection(section);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSection(null);
    }, 1600);
  };

  const resetQuestState = () => {
    setQuests([]);
    setCurrentQuestIndex(0);
    setCompletedQuestIds([]);
    setSelectedOption(null);
    setQuestError(null);
    setSubmitResult(createEmptyResult());
    setShowQuestOverlay(false);
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Fetch job details
  useEffect(() => {
    async function fetchJob() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${params.id}`);
        const data = await response.json();

        if (response.ok) {
          setJob(data);
          setIsSaved(Boolean(data.isSaved));
        } else {
          setError(data.error || "Job not found");
        }
      } catch (err) {
        setError("Failed to fetch job details");
        console.error("Error fetching job:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  // Check for existing analysis
  useEffect(() => {
    async function checkExistingAnalysis() {
      if (!session?.user?.id || !params.id) return;

      try {
        const response = await fetch(`/api/jobs/${params.id}/analyze`);
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error("Error checking existing analysis:", err);
      }
    }

    if (session?.user?.id && params.id) {
      checkExistingAnalysis();
      fetchQuest();
    }
  }, [session?.user?.id, params.id]);

  const fetchQuest = async () => {
    if (!params.id) return;
    try {
      setQuestLoading(true);
      setQuestError(null);
      const res = await fetch(`/api/jobs/${params.id}/simulate?count=3`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memuat simulasi");
      }
      const data = await res.json();
      const incomingQuests: QuestData[] = Array.isArray(data.quests)
        ? data.quests
        : data.quest
        ? [data.quest]
        : [];

      const userQuestResults: Record<string, QuestResult> = {};
      if (Array.isArray(data.userQuests)) {
        data.userQuests.forEach((uq: any) => {
          if (!uq?.questId) return;
          userQuestResults[uq.questId] = {
            status: uq.status,
            xpEarned: uq.xpEarned,
            isCorrect:
              typeof uq.isCorrect === "boolean"
                ? uq.isCorrect
                : uq.status === "completed",
            aiFeedback: uq.aiFeedback,
            selectedOption: uq.selectedOption,
            correctOption: uq.correctOption,
          };
        });
      } else if (data.userQuest && data.quest?.id) {
        userQuestResults[data.quest.id] = {
          status: data.userQuest.status,
          xpEarned: data.userQuest.xpEarned,
          isCorrect: data.userQuest.status === "completed",
          aiFeedback: data.userQuest.aiFeedback,
          selectedOption: data.userQuest.selectedOption,
          correctOption: data.quest?.correctOption,
        };
      }

      if (incomingQuests.length) {
        setQuests(incomingQuests);
        setCurrentQuestIndex(0);
        setCompletedQuestIds(Object.keys(userQuestResults));
        setSubmitResult(
          userQuestResults[incomingQuests[0].id] || createEmptyResult()
        );
        setSelectedOption(null);
        setShowQuestOverlay(true);
        setTimeout(() => focusSection("quest"), 150);
      } else {
        resetQuestState();
      }
    } catch (error) {
      console.error("Error fetching quest:", error);
      setQuestError(
        error instanceof Error ? error.message : "Gagal memuat simulasi"
      );
    } finally {
      setQuestLoading(false);
    }
  };

  // Handle analysis trigger
  const handleAnalyze = async () => {
    if (!session?.user?.id || !params.id) {
      router.push("/login");
      return;
    }

    try {
      // Immediately show analysis panel with loading state
      setShowAnalysis(true);
      setIsAnalyzing(true);
      setTimeout(() => focusSection("analysis"), 150);
      
      const response = await fetch(`/api/jobs/${params.id}/analyze`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        const error = await response.json();
        console.error("Analysis error:", error);
        // Hide panel if error
        setShowAnalysis(false);
      }
    } catch (err) {
      console.error("Error analyzing:", err);
      // Hide panel if error
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowAnalysisPanel = () => {
    setShowAnalysis(true);
    setTimeout(() => focusSection("analysis"), 120);
  };

  const handleToggleSave = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    if (!params.id) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/jobs/${params.id}/save`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menyimpan pekerjaan");
      }
      const data = await res.json();
      setIsSaved(Boolean(data.saved));
      toast.success(data.saved ? "Job disimpan" : "Job dihapus");
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Gagal menyimpan pekerjaan");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuest = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    try {
      setQuestLoading(true);
      setQuestError(null);
      setSelectedOption(null);
      setSubmitResult(createEmptyResult());
      setCompletedQuestIds([]);
      const res = await fetch(`/api/jobs/${params.id}/simulate?count=3`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat simulasi");
      }
      const data = await res.json();
      const incomingQuests: QuestData[] = Array.isArray(data.quests)
        ? data.quests
        : data.quest
        ? [data.quest]
        : [];
      if (incomingQuests.length) {
        setQuests(incomingQuests);
        setCurrentQuestIndex(0);
        setShowQuestOverlay(true);
        setTimeout(() => focusSection("quest"), 150);
      } else {
        resetQuestState();
      }
    } catch (error) {
      console.error("Error generating quest:", error);
      setQuestError(
        error instanceof Error ? error.message : "Gagal membuat simulasi"
      );
    } finally {
      setQuestLoading(false);
    }
  };

  const handleCloseQuestView = () => {
    resetQuestState();
  };

  const handleSubmitQuest = async () => {
    if (!currentQuest || !selectedOption) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/quests/${currentQuest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: selectedOption }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mengirim jawaban");
      }
      const data = await res.json();
      setSubmitResult({
        status: data.status,
        xpEarned: data.xpEarned,
        isCorrect: data.isCorrect,
        aiFeedback: data.aiFeedback,
        selectedOption: data.selectedOption,
        correctOption: data.correctOption,
      });
      setCompletedQuestIds((prev) =>
        prev.includes(currentQuest.id) ? prev : [...prev, currentQuest.id]
      );
      setSelectedOption(null);
      setTimeout(() => focusSection("quest"), 150);
    } catch (error) {
      console.error("Error submitting quest:", error);
      setQuestError(
        error instanceof Error ? error.message : "Gagal mengirim jawaban"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuest = () => {
    if (currentQuestIndex < quests.length - 1) {
      const nextIndex = currentQuestIndex + 1;
      setCurrentQuestIndex(nextIndex);
      setSubmitResult(createEmptyResult());
      setSelectedOption(null);
      setQuestError(null);
      setTimeout(() => focusSection("quest"), 150);
    }
  };

  const analysisHighlightClass =
    highlightedSection === "analysis"
      ? "ring-2 ring-blue-300 shadow-xl shadow-blue-100 scale-[1.01]"
      : "";
  const questHighlightClass =
    highlightedSection === "quest"
      ? "ring-2 ring-blue-300 shadow-xl shadow-blue-100 scale-[1.01]"
      : "";
  const hasQuestSubmission = Boolean(submitResult.status);
  const shouldShowQuestOverlay = Boolean(currentQuest && showQuestOverlay);
  const isLastQuestionAnswered = isLastQuest && hasQuestSubmission;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="flex items-center justify-center min-h-[60vh] pt-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopNav />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 mb-4">{error || "Job not found"}</p>
              <Button onClick={() => router.push("/")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className={`mx-auto px-4 pt-20 pb-8 transition-all duration-500 ease-in-out ${
        showAnalysis ? 'max-w-[1800px]' : 'max-w-7xl'
      }`}>
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ease-in-out ${
          showAnalysis ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
        }`}>
          {/* Main Content - Job Details */}
          <div className={`${showAnalysis ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6 transition-all duration-500 ease-in-out ${
            showAnalysis ? 'animate-fade-in-slide-left lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto' : ''
          }`}>
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16 rounded-lg">
                    <AvatarImage src={job.companyLogo} />
                    <AvatarFallback>{job.company[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                      {job.title}
                    </h1>
                    <p className="text-lg text-slate-600 mb-3">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-8 h-8" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="gap-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold">
                  <Briefcase className="w-5 h-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="job-content"
                  dangerouslySetInnerHTML={{ 
                    __html: job.description || job.jobDescriptionRaw || "No description available" 
                  }}
                />
              </CardContent>
            </Card>

            {/* Qualifications */}
            {(job.qualifications || job.qualificationsHtml) && (
              <Card className="gap-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <Code className="w-5 h-5" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="job-content"
                    dangerouslySetInnerHTML={{ 
                      __html: job.qualifications || job.qualificationsHtml || "No qualifications specified" 
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <Card className="gap-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <Code className="w-5 h-5" />
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar / Analysis Panel */}
          <div className={`${showAnalysis ? 'lg:col-span-1' : 'lg:col-span-1'} space-y-6 transition-all duration-500 ease-in-out`}>
            {/* Loading Panel */}
            {showAnalysis && isAnalyzing && (
              <div ref={analysisRef} className="scroll-mt-24">
                <Card className={`sticky top-20 h-fit shadow-lg animate-fade-in-slide-right transition-all duration-300 ${analysisHighlightClass}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                        Menganalisis Kecocokan
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 py-12">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      {/* Animated Loading Spinner */}
                      <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      </div>
                      
                      {/* Loading Text with Animation */}
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Menganalisis Profil Anda...
                        </h3>
                        <p className="text-sm text-slate-600 max-w-sm">
                          Kami sedang menganalisis skills, pengalaman, pendidikan, sertifikasi, dan proyek Anda untuk menentukan kecocokan dengan posisi ini.
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="mx-auto h-2 w-48 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
                          </div>
                          <p className="text-xs text-blue-600 font-medium">AI sedang bekerja untukmu</p>
                        </div>
                      </div>

                      {/* Loading Steps with staggered animation */}
                      <div className="w-full max-w-sm space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600 animate-fade-in">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <span>Menganalisis skills dan kualifikasi...</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                          <span>Mengevaluasi pengalaman kerja...</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                          <span>Menghitung skor kecocokan...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analysis Results Panel */}
            {showAnalysis && !isAnalyzing && analysis ? (
              <div ref={analysisRef} className="scroll-mt-24">
                <Card className={`sticky top-20 h-fit shadow-lg animate-fade-in-slide-right transition-all duration-300 ${analysisHighlightClass}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                        Hasil Analisis Kecocokan
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAnalysis(false)}
                        className="h-8 w-8 p-0"
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Match Score */}
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.matchScore / 100)}`}
                            className={`transition-all duration-1000 ${
                              analysis.matchScore >= 70
                                ? "text-green-600"
                                : analysis.matchScore >= 50
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div
                              className={`text-3xl font-bold ${
                                analysis.matchScore >= 70
                                  ? "text-green-600"
                                  : analysis.matchScore >= 50
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }`}
                            >
                              {analysis.matchScore}%
                            </div>
                            <div className="text-xs text-slate-600">Kecocokan</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {analysis.matchScore >= 70 ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              Sangat Cocok
                            </span>
                          </>
                        ) : analysis.matchScore >= 50 ? (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-500">
                              Cukup Cocok
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-red-500">
                              Perlu Peningkatan
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Skill Gap */}
                    {analysis.skillGap && (
                      <div className="space-y-4">
                        {/* Missing Skills */}
                        {analysis.skillGap.missing && analysis.skillGap.missing.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-semibold text-slate-900">
                                Skills yang Kurang
                              </span>
                            </div>
                            <div className="space-y-2">
                              {analysis.skillGap.missing.map((skill, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-red-50 rounded-md"
                                >
                                  <span className="text-sm text-slate-700">
                                    {skill.skill}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      skill.importance === "high"
                                        ? "border-red-500 text-red-700"
                                        : skill.importance === "medium"
                                        ? "border-orange-500 text-orange-700"
                                        : "border-yellow-500 text-yellow-700"
                                    }`}
                                  >
                                    {skill.importance === "high"
                                      ? "Penting"
                                      : skill.importance === "medium"
                                      ? "Sedang"
                                      : "Rendah"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Existing Skills */}
                        {analysis.skillGap.existing && analysis.skillGap.existing.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-slate-900">
                                Skills yang Sudah Ada
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {analysis.skillGap.existing.map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs border-green-500 text-green-700"
                                >
                                  {skill.skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* AI Recommendation */}
                    {analysis.recommendation && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span className="text-base font-semibold text-slate-900">
                            Rekomendasi AI
                          </span>
                        </div>
                        <div 
                          className="recommendation-content text-sm text-slate-700 leading-relaxed bg-blue-50 p-6 rounded-lg border border-blue-100"
                          dangerouslySetInnerHTML={{ __html: analysis.recommendation }}
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={() => router.push("/profile")}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Profil
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAnalysis(false)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Kembali ke Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {/* Apply Card - Hidden when analysis is showing */}
                {!showAnalysis && (
                  <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                      {/* Analysis Button */}
                      {session?.user && (
                        <>
                          {!showAnalysis && (
                            <Button
                              className="w-full"
                              size="lg"
                              onClick={handleAnalyze}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Menganalisis...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  {analysis ? "Analisis Ulang" : "Analisis Kecocokan"}
                                </>
                              )}
                            </Button>
                          )}
                          {analysis && !showAnalysis && !isAnalyzing && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleShowAnalysisPanel}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Lihat Hasil Analisis
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleGenerateQuest}
                            disabled={questLoading}
                          >
                            {questLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Menyiapkan simulasi...
                              </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Mulai Simulasi Job (3 soal)
                                </>
                              )}
                            </Button>
                          {currentQuest && !shouldShowQuestOverlay && (
                            <div ref={questRef} className="scroll-mt-24">
                              <Card className={`border border-blue-100 bg-blue-50 transition-all duration-300 ${questHighlightClass}`}>
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center justify-between">
                                    <span>Simulasi Quest</span>
                                    {progressLabel && (
                                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        {progressLabel}
                                      </span>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {hasQuestSubmission ? (
                                    <>
                                      <div className="rounded-lg border border-blue-200 bg-white/60 p-3 text-sm text-slate-800">
                                        <p className="font-semibold text-slate-900">
                                          Jawaban kamu sudah tersimpan.
                                        </p>
                                        <p className="text-slate-600">
                                          Lanjutkan simulasi berikutnya atau tutup untuk kembali ke detail pekerjaan.
                                        </p>
                                        {isLastQuestionAnswered && (
                                          <div className="mt-1 space-y-1">
                                            <p className="text-sm font-semibold text-blue-700">
                                              Sesi 3 soal selesai.
                                            </p>
                                            <p className="text-xs text-slate-600">
                                              Tutup lalu klik "Mulai Simulasi Job (3 soal)" untuk memulai sesi baru.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        {isLastQuestionAnswered ? (
                                          <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleCloseQuestView}
                                          >
                                            Tutup
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline"
                                              className="w-full sm:flex-1"
                                              onClick={handleCloseQuestView}
                                            >
                                              Tutup
                                            </Button>
                                            <Button
                                              className="w-full sm:flex-1"
                                              onClick={handleNextQuest}
                                            >
                                              <Sparkles className="w-4 h-4 mr-2" />
                                              Soal Berikutnya
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm text-slate-700">{currentQuest.question}</p>
                                      <div className="space-y-2">
                                        {currentQuest.options.map((opt) => (
                                          <label
                                            key={opt.label}
                                            className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${
                                              selectedOption === opt.label
                                                ? "border-blue-500 bg-white"
                                                : "border-slate-200 bg-white"
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              className="mt-1"
                                              name="quest-option"
                                              value={opt.label}
                                              checked={selectedOption === opt.label}
                                              onChange={() => setSelectedOption(opt.label)}
                                            />
                                            <div>
                                              <p className="font-semibold text-slate-900">
                                                {opt.label}. {opt.text.replace(/\[xp:\d+\]\s*/i, "")}
                                              </p>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                      <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                          variant="outline"
                                          className="w-full sm:flex-1"
                                          onClick={handleCloseQuestView}
                                        >
                                          Tutup
                                        </Button>
                                        <Button
                                          className="w-full sm:flex-1"
                                          onClick={handleSubmitQuest}
                                          disabled={!selectedOption || submitting}
                                        >
                                          {submitting ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Mengirim jawaban...
                                            </>
                                          ) : (
                                            "Submit Jawaban"
                                          )}
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                  {questError && (
                                    <p className="text-sm text-red-600">{questError}</p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          )}
                          <Separator />
                        </>
                      )}

                  {/* Job Type & Work Mode */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>{job.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.isWfh && (
                        <Badge variant="outline" className="text-xs">
                          Remote
                        </Badge>
                      )}
                      {job.isHybrid && (
                        <Badge variant="outline" className="text-xs">
                          Hybrid
                        </Badge>
                      )}
                      {job.isOpenFreshGrads && (
                        <Badge variant="outline" className="text-xs">
                          Fresh Grad
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {job.numberOfOpenings && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{job.numberOfOpenings} position(s) available</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>Posted {job.posted}</span>
                    </div>
                    {job.applicationEndDate && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Apply by {new Date(job.applicationEndDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>

                  <Button
                    variant={isSaved ? "secondary" : "outline"}
                    className="w-full"
                    onClick={handleToggleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : isSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        Tersimpan (klik untuk hapus)
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Job
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
                  </Card>
                )}

                {/* Company Info - Hidden when analysis is showing */}
                {!showAnalysis && job.companyInfo && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => setIsCompanyExpanded(!isCompanyExpanded)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    About Company
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={job.companyInfo.logo || ""} />
                      <AvatarFallback>{job.companyInfo.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{job.companyInfo.name}</p>
                      {job.companyInfo.industry && (
                        <p className="text-sm text-slate-600">
                          {job.companyInfo.industry}
                        </p>
                      )}
                    </div>
                  </div>

                  {job.companyInfo.description && (
                    <div className="overflow-hidden">
                      <div
                        className={`text-sm text-slate-600 transition-all duration-500 ease-in-out ${
                          isCompanyExpanded 
                            ? "max-h-[2000px] opacity-100" 
                            : "max-h-24 opacity-100 line-clamp-4"
                        }`}
                        style={{
                          transition: "max-height 0.5s ease-in-out, opacity 0.3s ease-in-out"
                        }}
                      >
                        {job.companyInfo.description.replace(/<[^>]*>/g, "")}
                      </div>
                      {job.companyInfo.description.replace(/<[^>]*>/g, "").length > 200 && (
                        <button
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCompanyExpanded(!isCompanyExpanded);
                          }}
                        >
                          {isCompanyExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  )}

                  {job.companyInfo.website && (
                    <Link
                      href={job.companyInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </Link>
                  )}
                </CardContent>
              </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {shouldShowQuestOverlay && currentQuest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm px-4 py-10">
          <div
            className="w-full max-w-3xl origin-top animate-fade-in-up"
            role="dialog"
            aria-modal="true"
          >
            <Card
              ref={questRef}
              className={`shadow-2xl transition-all duration-300 ${questHighlightClass}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-500">Simulasi Quest</p>
                  <CardTitle className="text-xl leading-tight text-slate-900">{currentQuest.question}</CardTitle>
                  {progressLabel && (
                    <p className="text-xs font-medium text-blue-700">{progressLabel}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleCloseQuestView}
                  aria-label="Tutup simulasi"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {!hasQuestSubmission && (
                  <div className="space-y-3">
                    {currentQuest.options.map((opt) => (
                      <label
                        key={opt.label}
                        className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm transition ${
                          selectedOption === opt.label
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          name="quest-option"
                          value={opt.label}
                          checked={selectedOption === opt.label}
                          onChange={() => setSelectedOption(opt.label)}
                        />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {opt.label}. {opt.text.replace(/\[xp:\d+\]\s*/i, "")}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {hasQuestSubmission && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-800 shadow-sm">
                    <p className="mb-1 font-semibold text-slate-900">
                      Jawaban kamu sudah tersimpan.
                    </p>
                    <p className="text-sm text-slate-600">
                      Lanjutkan simulasi berikutnya atau tutup untuk kembali ke detail pekerjaan.
                    </p>
                    {isLastQuestionAnswered && (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm font-semibold text-blue-700">
                          Sesi 3 soal selesai.
                        </p>
                        <p className="text-xs text-slate-600">
                          Tutup lalu klik "Mulai Simulasi Job (3 soal)" untuk memulai sesi baru.
                        </p>
                      </div>
                    )}
                    {submitResult.selectedOption && currentQuest && (
                      <p className="mt-2 text-sm text-slate-700">
                        Jawaban terakhir:{" "}
                        <span className="font-semibold text-slate-900">
                          {submitResult.selectedOption.toUpperCase()}.
                        </span>{" "}
                        {currentQuest.options
                          .find((opt) => opt.label === submitResult.selectedOption)
                          ?.text.replace(/\[xp:\d+\]\s*/i, "")}
                      </p>
                    )}
                    {submitResult.aiFeedback && (
                      <p className="mt-3 text-sm text-slate-800">
                        <span className="font-semibold text-blue-700">Feedback AI: </span>
                        {submitResult.aiFeedback}
                      </p>
                    )}
                    {submitResult.correctOption && (
                      <p className="mt-2 text-xs text-slate-500">
                        Jawaban yang Tepat: {submitResult.correctOption.toUpperCase()}
                      </p>
                    )}
                  </div>
                )}

                {questError && <p className="text-sm text-red-600">{questError}</p>}

                <div className="flex flex-col gap-3 sm:flex-row">
                  {hasQuestSubmission ? (
                    <>
                      {isLastQuestionAnswered ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCloseQuestView}
                        >
                          Tutup
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="w-full sm:flex-1"
                            onClick={handleCloseQuestView}
                          >
                            Tutup
                          </Button>
                          <Button
                            className="w-full sm:flex-1"
                            onClick={handleNextQuest}
                          >
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Soal Berikutnya
                            </>
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1"
                        onClick={handleCloseQuestView}
                      >
                        Tutup
                      </Button>
                      <Button
                        className="w-full sm:flex-1"
                        onClick={handleSubmitQuest}
                        disabled={!selectedOption || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mengirim jawaban...
                          </>
                        ) : (
                          "Submit Jawaban"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
