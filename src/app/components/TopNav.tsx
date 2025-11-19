"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Home, Briefcase, Bookmark, User, LogOut, Settings, Menu, LogIn, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Separator } from './ui/separator';

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function TopNav() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Get search query from URL params
  const urlQuery = useMemo(() => searchParams.get("q") || "", [searchParams]);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [mobileSearchQuery, setMobileSearchQuery] = useState(urlQuery);
  
  const isHomeActive = pathname === "/";
  const isSavedActive = pathname === "/saved";

  // Sync search query from URL params when URL changes
  useEffect(() => {
    setSearchQuery(urlQuery);
    setMobileSearchQuery(urlQuery);
  }, [urlQuery]);

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: "/" 
    });
    router.push("/");
    router.refresh();
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSearchClose = () => {
    setMobileSearchOpen(false);
    setMobileSearchQuery("");
  };

  const handleSearch = (query: string, isMobile: boolean = false) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      // Navigate to home with search query
      router.push(`/?q=${encodeURIComponent(trimmedQuery)}`);
      if (isMobile) {
        setMobileSearchOpen(false);
      }
    } else {
      // Clear search if empty
      router.push("/");
      if (isMobile) {
        setMobileSearchOpen(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent, isMobile: boolean = false) => {
    e.preventDefault();
    const query = isMobile ? mobileSearchQuery : searchQuery;
    handleSearch(query, isMobile);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isMobile: boolean = false) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = isMobile ? mobileSearchQuery : searchQuery;
      handleSearch(query, isMobile);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/15 backdrop-blur-sm border-b border-slate-200 z-50">
      <div className="max-w-[1440px] mx-auto px-4">
        {/* Mobile Search Mode */}
        {mobileSearchOpen ? (
          <form onSubmit={(e) => handleSearchSubmit(e, true)} className="flex items-center gap-2 h-16">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Cari pekerjaan, perusahaan..."
                className="pl-10 bg-slate-50 border-slate-200"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                onKeyDown={(e) => handleSearchKeyDown(e, true)}
                autoFocus
              />
            </div>
            <Button 
              type="submit"
              size="sm"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              onClick={handleSearchClose}
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close search</span>
            </Button>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between h-16 w-full">
          {/* Logo */}
              <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">JobAI</span>
            </Link>

                {/* Search Bar - Desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                type="text" 
                placeholder="Cari pekerjaan, perusahaan, atau skill..."
                className="pl-10 pr-10 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => {
                    setSearchQuery("");
                    router.push("/");
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </form>
          </div>

              {/* Desktop Navigation Menu */}
              <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className={`flex flex-col items-center gap-0.5 h-auto py-2 px-4 ${isHomeActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Link href="/saved">
              <Button variant="ghost" className={`flex flex-col items-center gap-0.5 h-auto py-2 px-4 ${isSavedActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
                <Bookmark className="w-5 h-5" />
                <span className="text-xs">Saved</span>
              </Button>
            </Link>
                {session?.user ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={session.user.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(session.user.name)}
                          </AvatarFallback>
                        </Avatar>
              <span className="text-xs">Profile</span>
            </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{session.user.name || "User"}</p>
                          <p className="text-xs text-muted-foreground">{session.user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/settings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900"
                    onClick={() => router.push("/login")}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-xs">Login</span>
                  </Button>
                )}
              </div>

              {/* Mobile Search & Menu Buttons */}
              <div className="md:hidden flex items-center gap-2">
                {/* Search Icon Button */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="w-5 h-5" />
                  <span className="sr-only">Search</span>
                </Button>

                {/* Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="w-6 h-6" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {/* User Profile Section */}
                      {session?.user ? (
                        <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 transition-colors">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={session.user.image || undefined} />
                            <AvatarFallback>
                              {getInitials(session.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {session.user.name || "User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {session.user.email}
                            </p>
          </div>
        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            router.push("/login");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                      )}

                      <Separator />

                      {/* Navigation Items */}
                      <div className="space-y-2">
                        <Link href="/" onClick={handleNavClick}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3"
                          >
                            <Home className="w-5 h-5" />
                            <span>Home</span>
                          </Button>
                        </Link>
                        <Link href="/saved" onClick={handleNavClick}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3"
                          >
                            <Bookmark className="w-5 h-5" />
                            <span>Saved</span>
                          </Button>
                        </Link>
      </div>

                      {session?.user && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-3"
                              onClick={() => {
                                router.push("/profile");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <User className="w-5 h-5" />
                              <span>Profile</span>
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-3"
                              onClick={() => {
                                router.push("/settings");
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Settings className="w-5 h-5" />
                              <span>Settings</span>
                            </Button>
                            <Separator />
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={handleLogout}
                            >
                              <LogOut className="w-5 h-5" />
                              <span>Logout</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
        </div>
          </>
        )}
      </div>
    </nav>
  );
}
