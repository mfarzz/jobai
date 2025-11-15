import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Filter, Briefcase, MapPin, Clock, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const trendingCategories = [
  { name: 'UI/UX Design', count: '2,345 jobs', trend: '+12%' },
  { name: 'Frontend Developer', count: '3,421 jobs', trend: '+18%' },
  { name: 'Product Manager', count: '1,234 jobs', trend: '+8%' },
  { name: 'Data Analyst', count: '1,876 jobs', trend: '+15%' },
  { name: 'Mobile Developer', count: '2,098 jobs', trend: '+10%' }
];

const quickFilters = [
  { icon: MapPin, label: 'Remote', active: false },
  { icon: Clock, label: 'Full-time', active: true },
  { icon: Briefcase, label: 'Fresh Graduate', active: false },
  { icon: Building2, label: 'Startup', active: false }
];

const hotCompanies = [
  { name: 'Tokopedia', jobs: 45 },
  { name: 'Gojek', jobs: 38 },
  { name: 'Shopee', jobs: 52 },
  { name: 'Bukalapak', jobs: 28 },
  { name: 'Traveloka', jobs: 31 }
];

export function RightSidebar() {
  return (
    <div className="space-y-4 sticky top-20">
      {/* Quick Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-600" />
          <h4>Quick Filters</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              className="gap-1"
            >
              <filter.icon className="w-3 h-3" />
              {filter.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Trending Categories */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4>Trending Job Categories</h4>
        </div>
        <div className="space-y-3">
          {trendingCategories.map((category, index) => (
            <div key={index}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <button className="text-left hover:text-blue-600 transition-colors">
                  {category.name}
                </button>
                <Badge variant="secondary" className="bg-green-100 text-green-700 shrink-0">
                  {category.trend}
                </Badge>
              </div>
              <p className="text-slate-500">{category.count}</p>
              {index < trendingCategories.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Hot Companies */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h4>Hot Companies Hiring</h4>
        </div>
        <div className="space-y-2">
          {hotCompanies.map((company, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{company.name}</span>
              <Badge variant="outline">{company.jobs} jobs</Badge>
            </div>
          ))}
        </div>
        <Button variant="link" className="w-full mt-2">
          View all companies
        </Button>
      </Card>

      {/* Market Insights */}
      <Card className="p-4">
        <h4 className="mb-3">Market Insights</h4>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-900 mb-1">Most Demanded Skill</p>
            <p className="text-blue-600">Figma & Design Systems</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-green-900 mb-1">Avg. Salary Growth</p>
            <p className="text-green-600">+15% this quarter</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-purple-900 mb-1">Top Location</p>
            <p className="text-purple-600">Jakarta (Remote)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
