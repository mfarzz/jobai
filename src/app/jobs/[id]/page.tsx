"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopNav } from "@/app/components/TopNav";
import { Footer } from "@/app/components/Footer";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
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

  // Fetch job details
  useEffect(() => {
    async function fetchJob() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${params.id}`);
        const data = await response.json();

        if (response.ok) {
          setJob(data);
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
    }
  }, [session?.user?.id, params.id]);

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
              <Card className="sticky top-20 h-fit shadow-lg animate-fade-in-slide-right">
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
            )}

            {/* Analysis Results Panel */}
            {showAnalysis && !isAnalyzing && analysis ? (
              <Card className="sticky top-20 h-fit shadow-lg animate-fade-in-slide-right">
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
                              onClick={() => setShowAnalysis(true)}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Lihat Hasil Analisis
                            </Button>
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

                  <Button variant="outline" className="w-full">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Job
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
      <Footer />
    </div>
  );
}

