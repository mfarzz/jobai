"use client";

import { useRouter } from 'next/navigation';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Clock, DollarSign, Bookmark, Send, Sparkles } from 'lucide-react';

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
}

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();

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
            <Button variant="ghost" size="icon" className="shrink-0">
              <Bookmark className="w-5 h-5" />
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
