import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { FileText, Settings, Sparkles, TrendingUp, Send, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export function LeftSidebar() {
  return (
    <div className="space-y-4 sticky top-20">
      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="px-4 pb-4">
          <div className="flex flex-col items-center -mt-8">
            <Avatar className="w-16 h-16 border-4 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
              <AvatarFallback>SN</AvatarFallback>
            </Avatar>
            <h3 className="mt-2">Sarah Nabilah</h3>
            <p className="text-slate-600 text-center">UI/UX Designer</p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>My Skills</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>My CV</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Preferences</span>
            </Button>
          </div>
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
