"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Sparkles, LogIn, User, LogOut, Briefcase, GraduationCap, Award, FolderOpen, Edit2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface ProfileStats {
  skillsCount: number;
  experiencesCount: number;
  educationsCount: number;
  certificationsCount: number;
  projectsCount: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function LeftSidebar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    async function fetchProfileStats() {
      if (!session?.user?.id) return;
      
      setIsLoadingStats(true);
      try {
        const [skillsRes, expRes, eduRes, certRes, projRes] = await Promise.all([
          fetch('/api/profile/skills'),
          fetch('/api/profile/experience'),
          fetch('/api/profile/education'),
          fetch('/api/profile/certifications'),
          fetch('/api/profile/projects')
        ]);

        const skills = skillsRes.ok ? await skillsRes.json() : [];
        const experiences = expRes.ok ? await expRes.json() : [];
        const educations = eduRes.ok ? await eduRes.json() : [];
        const certifications = certRes.ok ? await certRes.json() : [];
        const projects = projRes.ok ? await projRes.json() : [];

        setProfileStats({
          skillsCount: skills.length || 0,
          experiencesCount: experiences.length || 0,
          educationsCount: educations.length || 0,
          certificationsCount: certifications.length || 0,
          projectsCount: projects.length || 0,
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    if (session?.user?.id) {
      fetchProfileStats();
    }
  }, [session?.user?.id]);

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: "/" 
    });
    router.refresh();
  };

  if (status === "loading") {
    return (
      <div className="space-y-4 sticky top-20">
        <Card className="overflow-hidden">
          <div className="px-4 pb-4 pt-4">
            <div className="animate-pulse space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-slate-200 rounded-full"></div>
              </div>
              <div className="space-y-2 text-center">
                <div className="h-5 bg-slate-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-4 sticky top-20">
        <Card className="overflow-hidden">
          <div className="px-4 pb-4 pt-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">Belum Login</h3>
              <p className="text-slate-600 text-center text-sm mt-1">Silakan login untuk melihat profil</p>
            </div>

            <Separator className="my-4" />

            <Link href="/login" className="block">
              <Button className="w-full" size="sm">
                <LogIn className="w-4 h-4 mr-2" />
                <span>Login</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const user = session.user;
  const initials = getInitials(user.name);
  const totalStats = profileStats 
    ? profileStats.skillsCount + profileStats.experiencesCount + profileStats.educationsCount + 
      profileStats.certificationsCount + profileStats.projectsCount
    : 0;

  return (
    <div className="space-y-4 sticky top-20">
      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="px-4 pb-4 pt-4">
          {/* Avatar dan Info User */}
          <div className="flex flex-col items-center">
            <Avatar className="w-20 h-20 shadow-lg">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-3 font-semibold text-slate-900 text-center">{user.name || "User"}</h3>
            <p className="text-slate-600 text-center text-xs mt-0.5 break-all">{user.email}</p>
          
          </div>

          {/* Quick Stats */}
          {isLoadingStats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : profileStats && totalStats > 0 ? (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="p-1.5 bg-blue-500 rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Skills</p>
                    <p className="text-sm font-semibold text-slate-900">{profileStats.skillsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="p-1.5 bg-green-500 rounded-md">
                    <Briefcase className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Experience</p>
                    <p className="text-sm font-semibold text-slate-900">{profileStats.experiencesCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                  <div className="p-1.5 bg-purple-500 rounded-md">
                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Education</p>
                    <p className="text-sm font-semibold text-slate-900">{profileStats.educationsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                  <div className="p-1.5 bg-orange-500 rounded-md">
                    <FolderOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Projects</p>
                    <p className="text-sm font-semibold text-slate-900">{profileStats.projectsCount}</p>
                  </div>
                </div>
              </div>
              {(profileStats.certificationsCount > 0) && (
                <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                  <div className="p-1.5 bg-amber-500 rounded-md">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600">Certifications</p>
                    <p className="text-sm font-semibold text-slate-900">{profileStats.certificationsCount}</p>
                  </div>
                </div>
              )}
            </>
          ) : null}

          <Separator className="my-4" />

          {/* Menu Items */}
          <div className="space-y-2">
            <Link href="/profile" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Edit Profile</span>
              </Button>
            </Link>
            <Link href="/profile?tab=skills" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm">My Skills</span>
                {profileStats && profileStats.skillsCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {profileStats.skillsCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/profile?tab=experience" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Experience</span>
                {profileStats && profileStats.experiencesCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {profileStats.experiencesCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/profile?tab=projects" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Projects</span>
                {profileStats && profileStats.projectsCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {profileStats.projectsCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-700 hover:bg-red-50" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
