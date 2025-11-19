"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { FileText, Settings, Sparkles, TrendingUp, Send, Target, LogIn, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

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
        <Card className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-4 sticky top-20">
        <Card className="overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="px-4 pb-4">
            <div className="flex flex-col items-center -mt-8">
              <div className="w-16 h-16 border-4 border-white rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="mt-2 text-slate-900">Belum Login</h3>
              <p className="text-slate-600 text-center text-sm">Silakan login untuk melihat profil</p>
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

  return (
    <div className="space-y-4 sticky top-20">
      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="px-4 pb-4">
          <div className="flex flex-col items-center -mt-8">
            <Avatar className="w-16 h-16 border-4 border-white">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h3 className="mt-2 font-semibold text-slate-900">{user.name || "User"}</h3>
            <p className="text-slate-600 text-center text-sm">{user.email}</p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <Link href="/profile#skills" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>My Skills</span>
            </Button>
            </Link>
            <Link href="/profile#cv" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>My CV</span>
            </Button>
            </Link>
            <Link href="/profile#preferences" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Preferences</span>
            </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </Card>

      {/* Insights Card */}
      <Card className="p-4">
        <h4 className="mb-4">Quick Insights</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-slate-600">Applications</span>
            </div>
            <span className="font-semibold">12</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-slate-600">Match Score</span>
            </div>
            <span className="font-semibold">85%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-slate-600">New Today</span>
            </div>
            <span className="font-semibold">24</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
