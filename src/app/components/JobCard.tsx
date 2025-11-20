"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, Send, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  description: string;
  type: string;
  posted: string;
  salary: string;
  url?: string;
  isSaved?: boolean;
}

interface JobCardProps {
  job: Job;
  onToggleSave?: (saved: boolean) => void;
}

export function JobCard({ job, onToggleSave }: JobCardProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(job.isSaved));

  const handleViewDetails = () => {
    if (job.url) {
      router.push(job.url);
    }
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <Avatar className="w-12 h-12 rounded-lg">
          <AvatarImage src={job.companyLogo} />
          <AvatarFallback>{job.company[0]}</AvatarFallback>
        </Avatar>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 
                className="hover:text-blue-600 cursor-pointer mb-1"
                onClick={handleViewDetails}
              >
                {job.title}
              </h3>
              <p className="text-slate-600">{job.company}</p>
            </div>
            <Button
              variant={isSaved ? "secondary" : "ghost"}
              size="icon"
              className="shrink-0"
              disabled={saving}
              onClick={async () => {
                if (!job.id) return;
                try {
                  setSaving(true);
                  const res = await fetch(`/api/jobs/${job.id}/save`, { method: "POST" });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Gagal menyimpan");
                  }
                  const data = await res.json();
                  setIsSaved(Boolean(data.saved));
                  onToggleSave?.(Boolean(data.saved));
                  toast.success(Boolean(data.saved) ? "Job disimpan" : "Simpanan dihapus");
                } catch (error) {
                  console.error("Error toggling save:", error);
                  toast.error("Gagal menyimpan pekerjaan");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3 text-slate-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{job.posted}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
          </div>

          <p className="text-slate-600 mb-4 line-clamp-2">{job.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{job.type}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                View Details
              </Button>
              <Button 
                size="sm" 
                className="gap-1"
                onClick={() => {
                  if (job.url && job.url !== '#') {
                    router.push(job.url);
                  }
                }}
              >
                <Send className="w-4 h-4" />
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
