import { Search, Home, Briefcase, Bookmark, MessageSquare, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">JobAI</span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Cari pekerjaan, perusahaan, atau skill..."
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-blue-600">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900">
              <Briefcase className="w-5 h-5" />
              <span className="text-xs">Jobs</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900">
              <Bookmark className="w-5 h-5" />
              <span className="text-xs">Saved</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">Messages</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 text-slate-600 hover:text-slate-900">
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Cari pekerjaan, perusahaan..."
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>
      </div>
    </nav>
  );
}
