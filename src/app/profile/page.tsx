"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  MapPin,
  FileText,
  Save,
  X,
  Plus,
  Edit2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

const profileSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  headline: z.string().optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [editingCertification, setEditingCertification] = useState<string | null>(null);
  const [skills, setSkills] = useState<Array<{ id: string; skillName: string; level?: number }>>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experiences, setExperiences] = useState<Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>>([]);
  const [projects, setProjects] = useState<Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    url: string;
  }>>([]);
  const [certifications, setCertifications] = useState<Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    credentialId: string;
    url: string;
  }>>([]);
  const [educations, setEducations] = useState<Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      headline: "",
      bio: "",
      location: "",
    },
  });

  // Load profile info (always needed)
  useEffect(() => {
    async function loadProfileInfo() {
      if (!session?.user?.id) return;
      
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          form.reset({
            name: profileData.name || "",
            headline: "",
            bio: "",
            location: "",
          });
        }
      } catch (error) {
        console.error("Error loading profile info:", error);
      }
    }

    if (session?.user?.id) {
      loadProfileInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Load data based on active tab
  useEffect(() => {
    async function loadTabData() {
      if (!session?.user?.id || !activeTab) return;
      
      // Skip if already loaded
      if (loadedTabs.has(activeTab)) {
        return;
      }

      try {
        setLoadingTabs(prev => new Set(prev).add(activeTab));

        switch (activeTab) {
          case "overview":
            // Overview doesn't need additional data
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            setLoadedTabs(prev => new Set(prev).add(activeTab));
            break;

          case "experience":
            const expRes = await fetch("/api/profile/experience");
            if (expRes.ok) {
              const expData = await expRes.json();
              setExperiences(expData.map((exp: {
                id: string;
                title: string;
                company: string;
                location: string | null;
                startDate: Date | string;
                endDate: Date | string | null;
                current: boolean;
                description: string | null;
              }) => ({
                id: exp.id,
                title: exp.title,
                company: exp.company,
                location: exp.location || "",
                startDate: exp.startDate ? new Date(exp.startDate).toISOString().slice(0, 7) : "",
                endDate: exp.endDate ? new Date(exp.endDate).toISOString().slice(0, 7) : "",
                current: exp.current,
                description: exp.description || "",
              })));
              setLoadedTabs(prev => new Set(prev).add(activeTab));
            }
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;

          case "projects":
            const projRes = await fetch("/api/profile/projects");
            if (projRes.ok) {
              const projData = await projRes.json();
              setProjects(projData.map((proj: {
                id: string;
                name: string;
                description: string | null;
                startDate: Date | string | null;
                endDate: Date | string | null;
                url: string | null;
              }) => ({
                id: proj.id,
                name: proj.name,
                description: proj.description || "",
                startDate: proj.startDate ? new Date(proj.startDate).toISOString().slice(0, 7) : "",
                endDate: proj.endDate ? new Date(proj.endDate).toISOString().slice(0, 7) : "",
                url: proj.url || "",
              })));
              setLoadedTabs(prev => new Set(prev).add(activeTab));
            }
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;

          case "education":
            const eduRes = await fetch("/api/profile/education");
            if (eduRes.ok) {
              const eduData = await eduRes.json();
              setEducations(eduData.map((edu: {
                id: string;
                school: string;
                degree: string | null;
                field: string | null;
                startDate: Date | string | null;
                endDate: Date | string | null;
                current: boolean;
                description: string | null;
              }) => ({
                id: edu.id,
                school: edu.school,
                degree: edu.degree || "",
                field: edu.field || "",
                startDate: edu.startDate ? new Date(edu.startDate).toISOString().slice(0, 7) : "",
                endDate: edu.endDate ? new Date(edu.endDate).toISOString().slice(0, 7) : "",
                current: edu.current,
                description: edu.description || "",
              })));
              setLoadedTabs(prev => new Set(prev).add(activeTab));
            }
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;

          case "certifications":
            const certRes = await fetch("/api/profile/certifications");
            if (certRes.ok) {
              const certData = await certRes.json();
              setCertifications(certData.map((cert: {
                id: string;
                name: string;
                issuer: string;
                issueDate: Date | string;
                expiryDate: Date | string | null;
                credentialId: string | null;
                url: string | null;
              }) => ({
                id: cert.id,
                name: cert.name,
                issuer: cert.issuer,
                issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().slice(0, 7) : "",
                expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().slice(0, 7) : "",
                credentialId: cert.credentialId || "",
                url: cert.url || "",
              })));
              setLoadedTabs(prev => new Set(prev).add(activeTab));
            }
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;

          case "skills":
            const skillsRes = await fetch("/api/profile/skills");
            if (skillsRes.ok) {
              const skillsData = await skillsRes.json();
              setSkills(skillsData);
              setLoadedTabs(prev => new Set(prev).add(activeTab));
            }
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;

          case "cv":
            // CV tab doesn't need API call for now
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            setLoadedTabs(prev => new Set(prev).add(activeTab));
            break;

          default:
            setLoadingTabs(prev => {
              const next = new Set(prev);
              next.delete(activeTab);
              return next;
            });
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error);
        setLoadingTabs(prev => {
          const next = new Set(prev);
          next.delete(activeTab);
          return next;
        });
      }
    }

    if (session?.user?.id && activeTab) {
      loadTabData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, activeTab]);

  // Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      setIsEditing(false);
      toast.success("Profile berhasil diperbarui");
      // Refresh session to update user data
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    try {
      const response = await fetch("/api/profile/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillName: newSkill.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add skill");
      }

      const newSkillData = await response.json();
      setSkills([...skills, newSkillData]);
      setNewSkill("");
      toast.success("Skill berhasil ditambahkan");
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add("skills"));
    } catch (error) {
      console.error("Error adding skill:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan skill");
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete skill");
      }

      setSkills(skills.filter((s) => s.id !== skillId));
      toast.success("Skill berhasil dihapus");
    } catch (error) {
      console.error("Error removing skill:", error);
      toast.error("Gagal menghapus skill");
    }
  };

  // Experience handlers
  const handleSaveExperience = async (exp: typeof experiences[0], index: number) => {
    if (!exp.title || !exp.company || !exp.startDate) {
      toast.error("Harap isi field yang wajib (Title, Company, Start Date)");
      return;
    }

    try {
      const data = {
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        startDate: `${exp.startDate}-01`,
        endDate: exp.endDate ? `${exp.endDate}-01` : null,
        current: exp.current,
        description: exp.description || undefined,
      };

      let response;
      if (exp.id && !exp.id.startsWith("temp-")) {
        // Update existing
        response = await fetch(`/api/profile/experience/${exp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create new
        response = await fetch("/api/profile/experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save experience");
      }

      const saved = await response.json();
      const updated = [...experiences];
      updated[index] = {
        id: saved.id,
        title: saved.title,
        company: saved.company,
        location: saved.location || "",
        startDate: saved.startDate ? new Date(saved.startDate).toISOString().slice(0, 7) : "",
        endDate: saved.endDate ? new Date(saved.endDate).toISOString().slice(0, 7) : "",
        current: saved.current,
        description: saved.description || "",
      };
      setExperiences(updated);
      setEditingExperience(null);
      toast.success(exp.id && !exp.id.startsWith("temp-") ? "Pengalaman berhasil diperbarui" : "Pengalaman berhasil ditambahkan");
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add("experience"));
    } catch (error) {
      console.error("Error saving experience:", error);
      toast.error("Gagal menyimpan pengalaman");
    }
  };

  const handleDeleteExperience = async (expId: string, index: number) => {
    if (expId.startsWith("temp-")) {
      setExperiences(experiences.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/profile/experience/${expId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete experience");
      }

      setExperiences(experiences.filter((_, i) => i !== index));
      toast.success("Pengalaman berhasil dihapus");
    } catch (error) {
      console.error("Error deleting experience:", error);
      toast.error("Gagal menghapus pengalaman");
    }
  };

  // Project handlers
  const handleSaveProject = async (proj: typeof projects[0], index: number) => {
    if (!proj.name) {
      toast.error("Harap isi nama proyek");
      return;
    }

    try {
      const data = {
        name: proj.name,
        description: proj.description || undefined,
        startDate: proj.startDate ? `${proj.startDate}-01` : null,
        endDate: proj.endDate ? `${proj.endDate}-01` : null,
        url: proj.url || undefined,
      };

      let response;
      if (proj.id && !proj.id.startsWith("temp-")) {
        response = await fetch(`/api/profile/projects/${proj.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch("/api/profile/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save project");
      }

      const saved = await response.json();
      const updated = [...projects];
      updated[index] = {
        id: saved.id,
        name: saved.name,
        description: saved.description || "",
        startDate: saved.startDate ? new Date(saved.startDate).toISOString().slice(0, 7) : "",
        endDate: saved.endDate ? new Date(saved.endDate).toISOString().slice(0, 7) : "",
        url: saved.url || "",
      };
      setProjects(updated);
      setEditingProject(null);
      toast.success(proj.id && !proj.id.startsWith("temp-") ? "Proyek berhasil diperbarui" : "Proyek berhasil ditambahkan");
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add("projects"));
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Gagal menyimpan proyek");
    }
  };

  const handleDeleteProject = async (projId: string, index: number) => {
    if (projId.startsWith("temp-")) {
      setProjects(projects.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/profile/projects/${projId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      setProjects(projects.filter((_, i) => i !== index));
      toast.success("Proyek berhasil dihapus");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Gagal menghapus proyek");
    }
  };

  // Education handlers
  const handleSaveEducation = async (edu: typeof educations[0], index: number) => {
    if (!edu.school) {
      toast.error("Harap isi nama sekolah");
      return;
    }

    try {
      const data = {
        school: edu.school,
        degree: edu.degree || undefined,
        field: edu.field || undefined,
        startDate: edu.startDate ? `${edu.startDate}-01` : null,
        endDate: edu.endDate ? `${edu.endDate}-01` : null,
        current: edu.current,
        description: edu.description || undefined,
      };

      let response;
      if (edu.id && !edu.id.startsWith("temp-")) {
        response = await fetch(`/api/profile/education/${edu.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch("/api/profile/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save education");
      }

      const saved = await response.json();
      const updated = [...educations];
      updated[index] = {
        id: saved.id,
        school: saved.school,
        degree: saved.degree || "",
        field: saved.field || "",
        startDate: saved.startDate ? new Date(saved.startDate).toISOString().slice(0, 7) : "",
        endDate: saved.endDate ? new Date(saved.endDate).toISOString().slice(0, 7) : "",
        current: saved.current,
        description: saved.description || "",
      };
      setEducations(updated);
      setEditingEducation(null);
      toast.success(edu.id && !edu.id.startsWith("temp-") ? "Pendidikan berhasil diperbarui" : "Pendidikan berhasil ditambahkan");
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add("education"));
    } catch (error) {
      console.error("Error saving education:", error);
      alert("Failed to save education");
    }
  };

  const handleDeleteEducation = async (eduId: string, index: number) => {
    if (eduId.startsWith("temp-")) {
      setEducations(educations.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/profile/education/${eduId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete education");
      }

      setEducations(educations.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting education:", error);
      alert("Failed to delete education");
    }
  };

  // Certification handlers
  const handleSaveCertification = async (cert: typeof certifications[0], index: number) => {
    if (!cert.name || !cert.issuer || !cert.issueDate) {
      alert("Please fill in required fields (Name, Issuer, Issue Date)");
      return;
    }

    try {
      const data = {
        name: cert.name,
        issuer: cert.issuer,
        issueDate: `${cert.issueDate}-01`,
        expiryDate: cert.expiryDate ? `${cert.expiryDate}-01` : null,
        credentialId: cert.credentialId || undefined,
        url: cert.url || undefined,
      };

      let response;
      if (cert.id && !cert.id.startsWith("temp-")) {
        response = await fetch(`/api/profile/certifications/${cert.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch("/api/profile/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save certification");
      }

      const saved = await response.json();
      const updated = [...certifications];
      updated[index] = {
        id: saved.id,
        name: saved.name,
        issuer: saved.issuer,
        issueDate: saved.issueDate ? new Date(saved.issueDate).toISOString().slice(0, 7) : "",
        expiryDate: saved.expiryDate ? new Date(saved.expiryDate).toISOString().slice(0, 7) : "",
        credentialId: saved.credentialId || "",
        url: saved.url || "",
      };
      setCertifications(updated);
      setEditingCertification(null);
      toast.success(cert.id && !cert.id.startsWith("temp-") ? "Sertifikasi berhasil diperbarui" : "Sertifikasi berhasil ditambahkan");
      // Mark tab as loaded
      setLoadedTabs(prev => new Set(prev).add("certifications"));
    } catch (error) {
      console.error("Error saving certification:", error);
      alert("Failed to save certification");
    }
  };

  const handleDeleteCertification = async (certId: string, index: number) => {
    if (certId.startsWith("temp-")) {
      setCertifications(certifications.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/profile/certifications/${certId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete certification");
      }

      setCertifications(certifications.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting certification:", error);
      alert("Failed to delete certification");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }


  const user = session.user;
  const initials = getInitials(user.name);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 pb-6">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {user.name || "User"}
                    </h1>
                    {form.watch("headline") && (
                      <p className="text-slate-600 mb-2">{form.watch("headline")}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      {form.watch("location") && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{form.watch("location")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
            </TabsList>
            <TabsList className="grid w-full grid-cols-3 gap-1">
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="cv">CV & Documents</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your profile information and visibility</CardDescription>
                  </div>
                  <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => {
                        if (isEditing) {
                          form.reset();
                        }
                        setIsEditing(!isEditing);
                      }}
                    >
                      {isEditing ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              placeholder="Enter your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headline</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              placeholder="e.g., Senior UI/UX Designer"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing}
                              placeholder="e.g., Jakarta, Indonesia"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={!isEditing}
                              placeholder="Tell us about yourself..."
                              rows={5}
                              maxLength={500}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-slate-500">
                            <FormMessage />
                            <span>{field.value?.length || 0}/500</span>
                          </div>
                        </FormItem>
                      )}
                    />

                    {isEditing && (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            form.reset();
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
            {loadingTabs.has("experience") ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading experiences...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>Add your professional work experience</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setExperiences([...experiences, {
                      id: Date.now().toString(),
                      title: "",
                      company: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      description: "",
                    }]);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiences.length > 0 ? (
                  experiences.map((exp, index) => {
                    const isNew = exp.id.startsWith("temp-");
                    const isEditing = editingExperience === exp.id;
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return "";
                      const date = new Date(dateStr + "-01");
                      return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
                    };
                    
                    return (
                      <div key={exp.id}>
                        {isNew ? (
                          <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Job Title"
                                        value={exp.title}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].title = e.target.value;
                                          setExperiences(updated);
                                        }}
                                        className="font-semibold mb-1"
                                      />
                                      <Input
                                        placeholder="Company Name"
                                        value={exp.company}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].company = e.target.value;
                                          setExperiences(updated);
                                        }}
                                        className="text-slate-600 mb-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveExperience(exp, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteExperience(exp.id, index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Location</label>
                                    <Input
                                      placeholder="City, Country"
                                      value={exp.location}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].location = e.target.value;
                                        setExperiences(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={exp.current}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].current = e.target.checked;
                                        setExperiences(updated);
                                      }}
                                      className="mt-6"
                                    />
                                    <label className="text-sm text-slate-600 mt-6">Currently working here</label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={exp.startDate}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].startDate = e.target.value;
                                        setExperiences(updated);
                                      }}
                                    />
                                  </div>
                                  {!exp.current && (
                                    <div>
                                      <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                      <Input
                                        type="month"
                                        value={exp.endDate}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].endDate = e.target.value;
                                          setExperiences(updated);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Description</label>
                                  <Textarea
                                    placeholder="Describe your role and achievements..."
                                    value={exp.description}
                                    onChange={(e) => {
                                      const updated = [...experiences];
                                      updated[index].description = e.target.value;
                                      setExperiences(updated);
                                    }}
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : isEditing ? (
                          <Card className="border-0 shadow-none">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Job Title"
                                        value={exp.title}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].title = e.target.value;
                                          setExperiences(updated);
                                        }}
                                        className="font-semibold mb-1"
                                      />
                                      <Input
                                        placeholder="Company Name"
                                        value={exp.company}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].company = e.target.value;
                                          setExperiences(updated);
                                        }}
                                        className="text-slate-600 mb-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveExperience(exp, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingExperience(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Location</label>
                                    <Input
                                      placeholder="City, Country"
                                      value={exp.location}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].location = e.target.value;
                                        setExperiences(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={exp.current}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].current = e.target.checked;
                                        setExperiences(updated);
                                      }}
                                      className="mt-6"
                                    />
                                    <label className="text-sm text-slate-600 mt-6">Currently working here</label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={exp.startDate}
                                      onChange={(e) => {
                                        const updated = [...experiences];
                                        updated[index].startDate = e.target.value;
                                        setExperiences(updated);
                                      }}
                                    />
                                  </div>
                                  {!exp.current && (
                                    <div>
                                      <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                      <Input
                                        type="month"
                                        value={exp.endDate}
                                        onChange={(e) => {
                                          const updated = [...experiences];
                                          updated[index].endDate = e.target.value;
                                          setExperiences(updated);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Description</label>
                                  <Textarea
                                    placeholder="Describe your role and achievements..."
                                    value={exp.description}
                                    onChange={(e) => {
                                      const updated = [...experiences];
                                      updated[index].description = e.target.value;
                                      setExperiences(updated);
                                    }}
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Briefcase className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900">{exp.title || "Job Title"}</h3>
                                  <p className="text-slate-600">{exp.company || "Company Name"}</p>
                                  {exp.location && (
                                    <p className="text-sm text-slate-500 mt-1">{exp.location}</p>
                                  )}
                                  <p className="text-sm text-slate-500 mt-1">
                                    {formatDate(exp.startDate)} - {exp.current ? "Sekarang" : exp.endDate ? formatDate(exp.endDate) : ""}
                                  </p>
                                  {exp.description && (
                                    <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingExperience(exp.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {!isNew && index < experiences.length - 1 && <Separator className="my-4" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No work experience added</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Add your work experience to showcase your professional background
                    </p>
                    <Button onClick={() => {
                      setExperiences([...experiences, {
                        id: Date.now().toString(),
                        title: "",
                        company: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        current: false,
                        description: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            {loadingTabs.has("projects") ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading projects...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>Showcase your projects and portfolio</CardDescription>
                    </div>
                    <Button onClick={() => {
                      setProjects([...projects, {
                        id: `temp-${Date.now()}`,
                        name: "",
                        description: "",
                        startDate: "",
                        endDate: "",
                        url: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                {projects.length > 0 ? (
                  projects.map((project, index) => {
                    const isNew = project.id.startsWith("temp-");
                    const isEditing = editingProject === project.id;
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return "";
                      const date = new Date(dateStr + "-01");
                      return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
                    };
                    
                    return (
                      <div key={project.id}>
                        {isNew ? (
                          <Card className="border-2 border-dashed border-purple-300 bg-purple-50/30">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <FolderKanban className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Project Name"
                                        value={project.name}
                                        onChange={(e) => {
                                          const updated = [...projects];
                                          updated[index].name = e.target.value;
                                          setProjects(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <Textarea
                                        placeholder="Project description..."
                                        value={project.description}
                                        onChange={(e) => {
                                          const updated = [...projects];
                                          updated[index].description = e.target.value;
                                          setProjects(updated);
                                        }}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveProject(project, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteProject(project.id, index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={project.startDate}
                                      onChange={(e) => {
                                        const updated = [...projects];
                                        updated[index].startDate = e.target.value;
                                        setProjects(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                    <Input
                                      type="month"
                                      value={project.endDate}
                                      onChange={(e) => {
                                        const updated = [...projects];
                                        updated[index].endDate = e.target.value;
                                        setProjects(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Project URL</label>
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={project.url}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index].url = e.target.value;
                                      setProjects(updated);
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : isEditing ? (
                          <Card className="border-0 shadow-none">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <FolderKanban className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Project Name"
                                        value={project.name}
                                        onChange={(e) => {
                                          const updated = [...projects];
                                          updated[index].name = e.target.value;
                                          setProjects(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <Textarea
                                        placeholder="Project description..."
                                        value={project.description}
                                        onChange={(e) => {
                                          const updated = [...projects];
                                          updated[index].description = e.target.value;
                                          setProjects(updated);
                                        }}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveProject(project, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingProject(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={project.startDate}
                                      onChange={(e) => {
                                        const updated = [...projects];
                                        updated[index].startDate = e.target.value;
                                        setProjects(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                    <Input
                                      type="month"
                                      value={project.endDate}
                                      onChange={(e) => {
                                        const updated = [...projects];
                                        updated[index].endDate = e.target.value;
                                        setProjects(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Project URL</label>
                                  <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={project.url}
                                    onChange={(e) => {
                                      const updated = [...projects];
                                      updated[index].url = e.target.value;
                                      setProjects(updated);
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <FolderKanban className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900">{project.name || "Project Name"}</h3>
                                  {project.description && (
                                    <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                                  )}
                                  <p className="text-sm text-slate-500 mt-1">
                                    {project.startDate && formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : "Sekarang"}
                                  </p>
                                  {project.url && (
                                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                                      {project.url}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingProject(project.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {!isNew && index < projects.length - 1 && <Separator className="my-4" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <FolderKanban className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No projects added</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Add your projects to showcase your work and achievements
                    </p>
                    <Button onClick={() => {
                      setProjects([...projects, {
                        id: `temp-${Date.now()}`,
                        name: "",
                        description: "",
                        startDate: "",
                        endDate: "",
                        url: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            {loadingTabs.has("education") ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading education...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Add your educational background</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEducations([...educations, {
                      id: `temp-${Date.now()}`,
                      school: "",
                      degree: "",
                      field: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      description: "",
                    }]);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {educations.length > 0 ? (
                  educations.map((edu, index) => {
                    const isNew = edu.id.startsWith("temp-");
                    const isEditing = editingEducation === edu.id;
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return "";
                      const date = new Date(dateStr + "-01");
                      return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
                    };
                    
                    return (
                      <div key={edu.id}>
                        {isNew ? (
                          <Card className="border-2 border-dashed border-green-300 bg-green-50/30">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                      <GraduationCap className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="School/University Name"
                                        value={edu.school}
                                        onChange={(e) => {
                                          const updated = [...educations];
                                          updated[index].school = e.target.value;
                                          setEducations(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          placeholder="Degree (e.g., Bachelor's)"
                                          value={edu.degree}
                                          onChange={(e) => {
                                            const updated = [...educations];
                                            updated[index].degree = e.target.value;
                                            setEducations(updated);
                                          }}
                                        />
                                        <Input
                                          placeholder="Field of Study"
                                          value={edu.field}
                                          onChange={(e) => {
                                            const updated = [...educations];
                                            updated[index].field = e.target.value;
                                            setEducations(updated);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveEducation(edu, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteEducation(edu.id, index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={edu.current}
                                    onChange={(e) => {
                                      const updated = [...educations];
                                      updated[index].current = e.target.checked;
                                      setEducations(updated);
                                    }}
                                  />
                                  <label className="text-sm text-slate-600">Currently studying</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={edu.startDate}
                                      onChange={(e) => {
                                        const updated = [...educations];
                                        updated[index].startDate = e.target.value;
                                        setEducations(updated);
                                      }}
                                    />
                                  </div>
                                  {!edu.current && (
                                    <div>
                                      <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                      <Input
                                        type="month"
                                        value={edu.endDate}
                                        onChange={(e) => {
                                          const updated = [...educations];
                                          updated[index].endDate = e.target.value;
                                          setEducations(updated);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Description (Optional)</label>
                                  <Textarea
                                    placeholder="Additional information about your education..."
                                    value={edu.description}
                                    onChange={(e) => {
                                      const updated = [...educations];
                                      updated[index].description = e.target.value;
                                      setEducations(updated);
                                    }}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : isEditing ? (
                          <Card className="border-0 shadow-none">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                      <GraduationCap className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="School/University Name"
                                        value={edu.school}
                                        onChange={(e) => {
                                          const updated = [...educations];
                                          updated[index].school = e.target.value;
                                          setEducations(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          placeholder="Degree (e.g., Bachelor's)"
                                          value={edu.degree}
                                          onChange={(e) => {
                                            const updated = [...educations];
                                            updated[index].degree = e.target.value;
                                            setEducations(updated);
                                          }}
                                        />
                                        <Input
                                          placeholder="Field of Study"
                                          value={edu.field}
                                          onChange={(e) => {
                                            const updated = [...educations];
                                            updated[index].field = e.target.value;
                                            setEducations(updated);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveEducation(edu, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingEducation(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={edu.current}
                                    onChange={(e) => {
                                      const updated = [...educations];
                                      updated[index].current = e.target.checked;
                                      setEducations(updated);
                                    }}
                                  />
                                  <label className="text-sm text-slate-600">Currently studying</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Start Date</label>
                                    <Input
                                      type="month"
                                      value={edu.startDate}
                                      onChange={(e) => {
                                        const updated = [...educations];
                                        updated[index].startDate = e.target.value;
                                        setEducations(updated);
                                      }}
                                    />
                                  </div>
                                  {!edu.current && (
                                    <div>
                                      <label className="text-sm text-slate-600 mb-1 block">End Date</label>
                                      <Input
                                        type="month"
                                        value={edu.endDate}
                                        onChange={(e) => {
                                          const updated = [...educations];
                                          updated[index].endDate = e.target.value;
                                          setEducations(updated);
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm text-slate-600 mb-1 block">Description (Optional)</label>
                                  <Textarea
                                    placeholder="Additional information about your education..."
                                    value={edu.description}
                                    onChange={(e) => {
                                      const updated = [...educations];
                                      updated[index].description = e.target.value;
                                      setEducations(updated);
                                    }}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                  <GraduationCap className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900">{edu.school || "School/University Name"}</h3>
                                  {(edu.degree || edu.field) && (
                                    <p className="text-slate-600">{[edu.degree, edu.field].filter(Boolean).join(", ")}</p>
                                  )}
                                  <p className="text-sm text-slate-500 mt-1">
                                    {formatDate(edu.startDate)} - {edu.current ? "Sekarang" : edu.endDate ? formatDate(edu.endDate) : ""}
                                  </p>
                                  {edu.description && (
                                    <p className="text-sm text-slate-600 mt-2">{edu.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingEducation(edu.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {!isNew && index < educations.length - 1 && <Separator className="my-4" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No education added</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Add your educational background to complete your profile
                    </p>
                    <Button onClick={() => {
                      setEducations([...educations, {
                        id: Date.now().toString(),
                        school: "",
                        degree: "",
                        field: "",
                        startDate: "",
                        endDate: "",
                        current: false,
                        description: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            {loadingTabs.has("certifications") ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading certifications...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Certifications</CardTitle>
                      <CardDescription>Add your professional certifications</CardDescription>
                    </div>
                    <Button onClick={() => {
                      setCertifications([...certifications, {
                        id: `temp-${Date.now()}`,
                        name: "",
                        issuer: "",
                        issueDate: "",
                        expiryDate: "",
                        credentialId: "",
                        url: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                {certifications.length > 0 ? (
                  certifications.map((cert, index) => {
                    const isNew = cert.id.startsWith("temp-");
                    const isEditing = editingCertification === cert.id;
                    const formatDate = (dateStr: string) => {
                      if (!dateStr) return "";
                      const date = new Date(dateStr + "-01");
                      return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
                    };
                    
                    return (
                      <div key={cert.id}>
                        {isNew ? (
                          <Card className="border-2 border-dashed border-amber-300 bg-amber-50/30">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                      <Award className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Certification Name"
                                        value={cert.name}
                                        onChange={(e) => {
                                          const updated = [...certifications];
                                          updated[index].name = e.target.value;
                                          setCertifications(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <Input
                                        placeholder="Issuing Organization"
                                        value={cert.issuer}
                                        onChange={(e) => {
                                          const updated = [...certifications];
                                          updated[index].issuer = e.target.value;
                                          setCertifications(updated);
                                        }}
                                        className="text-slate-600"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveCertification(cert, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteCertification(cert.id, index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Issue Date</label>
                                    <Input
                                      type="month"
                                      value={cert.issueDate}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].issueDate = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Expiry Date (Optional)</label>
                                    <Input
                                      type="month"
                                      value={cert.expiryDate}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].expiryDate = e.target.value;
                                        setCertifications(updated);
                                      }}
                                      placeholder="Leave empty if no expiry"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Credential ID</label>
                                    <Input
                                      placeholder="Credential ID or License Number"
                                      value={cert.credentialId}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].credentialId = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Credential URL</label>
                                    <Input
                                      type="url"
                                      placeholder="https://example.com/verify"
                                      value={cert.url}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].url = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : isEditing ? (
                          <Card className="border-0 shadow-none">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                      <Award className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Certification Name"
                                        value={cert.name}
                                        onChange={(e) => {
                                          const updated = [...certifications];
                                          updated[index].name = e.target.value;
                                          setCertifications(updated);
                                        }}
                                        className="font-semibold mb-2"
                                      />
                                      <Input
                                        placeholder="Issuing Organization"
                                        value={cert.issuer}
                                        onChange={(e) => {
                                          const updated = [...certifications];
                                          updated[index].issuer = e.target.value;
                                          setCertifications(updated);
                                        }}
                                        className="text-slate-600"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveCertification(cert, index)}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingCertification(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Issue Date</label>
                                    <Input
                                      type="month"
                                      value={cert.issueDate}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].issueDate = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Expiry Date (Optional)</label>
                                    <Input
                                      type="month"
                                      value={cert.expiryDate}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].expiryDate = e.target.value;
                                        setCertifications(updated);
                                      }}
                                      placeholder="Leave empty if no expiry"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Credential ID</label>
                                    <Input
                                      placeholder="Credential ID or License Number"
                                      value={cert.credentialId}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].credentialId = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-600 mb-1 block">Credential URL</label>
                                    <Input
                                      type="url"
                                      placeholder="https://example.com/verify"
                                      value={cert.url}
                                      onChange={(e) => {
                                        const updated = [...certifications];
                                        updated[index].url = e.target.value;
                                        setCertifications(updated);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <Award className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-900">{cert.name || "Certification Name"}</h3>
                                  <p className="text-slate-600">{cert.issuer || "Issuing Organization"}</p>
                                  <p className="text-sm text-slate-500 mt-1">
                                    Diterbitkan: {formatDate(cert.issueDate)}
                                    {cert.expiryDate && ` - Berakhir: ${formatDate(cert.expiryDate)}`}
                                  </p>
                                  {cert.credentialId && (
                                    <p className="text-sm text-slate-500 mt-1">ID: {cert.credentialId}</p>
                                  )}
                                  {cert.url && (
                                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                                      {cert.url}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingCertification(cert.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {!isNew && index < certifications.length - 1 && <Separator className="my-4" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No certifications added</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Add your certifications to showcase your professional qualifications
                    </p>
                    <Button onClick={() => {
                      setCertifications([...certifications, {
                        id: Date.now().toString(),
                        name: "",
                        issuer: "",
                        issueDate: "",
                        expiryDate: "",
                        credentialId: "",
                        url: "",
                      }]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            {loadingTabs.has("skills") ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading skills...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
              <CardHeader>
                <div>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Add your skills to improve job matching</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., React, Figma, Python)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-2"
                      >
                        <Sparkles className="w-3 h-3" />
                        {skill.skillName}
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    No skills added yet. Add your skills to get better job matches!
                  </p>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* CV Tab */}
          <TabsContent value="cv">
            <Card>
              <CardHeader>
                <CardTitle>CV & Documents</CardTitle>
                <CardDescription>Upload your CV and other documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No CV uploaded</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Upload your CV to help employers find you
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload CV
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Other Documents</h4>
                  <p className="text-sm text-slate-500">
                    You can upload portfolio, certificates, and other supporting documents.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

