import { JobCard } from './JobCard';
import { Sparkles, Clock } from 'lucide-react';

const aiRecommendedJobs = [
  {
    id: '1',
    title: 'Senior UI/UX Designer',
    company: 'Tokopedia',
    companyLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia',
    description: 'We are looking for a Senior UI/UX Designer to join our design team. You will work on creating intuitive and engaging user experiences for millions of users.',
    matchScore: 92,
    type: 'Full-time',
    posted: '2 hours ago',
    salary: 'Rp 15-25 jt/bulan'
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'Gojek',
    companyLogo: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia (Remote)',
    description: 'Join our product design team to shape the future of Southeast Asia\'s leading on-demand services platform. Experience with design systems is a plus.',
    matchScore: 88,
    type: 'Full-time',
    posted: '5 hours ago',
    salary: 'Rp 18-30 jt/bulan'
  },
  {
    id: '3',
    title: 'UX Researcher',
    company: 'Shopee',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia',
    description: 'We need a UX Researcher to help us understand user behavior and improve our e-commerce platform. Conduct user interviews and usability testing.',
    matchScore: 85,
    type: 'Full-time',
    posted: '1 day ago',
    salary: 'Rp 12-20 jt/bulan'
  }
];

const latestJobs = [
  {
    id: '4',
    title: 'UI Designer',
    company: 'Bukalapak',
    companyLogo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia',
    description: 'Create beautiful and functional user interfaces for our mobile and web applications. Collaborate with product managers and developers.',
    matchScore: 78,
    type: 'Full-time',
    posted: '3 hours ago',
    salary: 'Rp 10-18 jt/bulan'
  },
  {
    id: '5',
    title: 'Visual Designer',
    company: 'Traveloka',
    companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia (Hybrid)',
    description: 'We\'re looking for a creative Visual Designer to craft stunning visuals for our marketing campaigns and product features.',
    matchScore: 75,
    type: 'Full-time',
    posted: '6 hours ago',
    salary: 'Rp 12-22 jt/bulan'
  },
  {
    id: '6',
    title: 'Interaction Designer',
    company: 'OVO',
    companyLogo: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia',
    description: 'Design delightful interactions and micro-animations for our fintech products. Strong understanding of motion design required.',
    matchScore: 82,
    type: 'Full-time',
    posted: '8 hours ago',
    salary: 'Rp 14-24 jt/bulan'
  },
  {
    id: '7',
    title: 'UX/UI Designer',
    company: 'Blibli',
    companyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    location: 'Jakarta, Indonesia',
    description: 'Join our design team to create seamless shopping experiences. Work on web and mobile app design with modern tools.',
    matchScore: 80,
    type: 'Full-time',
    posted: '1 day ago',
    salary: 'Rp 11-19 jt/bulan'
  }
];

export function JobFeed() {
  return (
    <div className="space-y-6">
      {/* AI Recommended Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2>For You - AI Recommended</h2>
          <span className="text-slate-500">(Based on your profile)</span>
        </div>
        <div className="space-y-4">
          {aiRecommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Latest Jobs Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-slate-600" />
          <h2>Latest Jobs</h2>
          <span className="text-slate-500">(Real-time updates)</span>
        </div>
        <div className="space-y-4">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center py-4">
        <button className="text-blue-600 hover:text-blue-700 hover:underline">
          Load more jobs...
        </button>
      </div>
    </div>
  );
}
