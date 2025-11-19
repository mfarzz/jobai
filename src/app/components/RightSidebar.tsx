"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Filter, Briefcase, Clock, Building2, Loader2, Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from './ui/utils';

interface HotCompany {
  name: string;
  jobs: number;
}

interface MarketInsights {
  mostDemandedSkill: string;
  salaryGrowth: string;
  topLocation: string;
  totalJobs: number;
  remoteJobs: number;
  hybridJobs: number;
  freshGradJobs: number;
}

interface FilterOption {
  label: string;
  value: string;
  filter: 'type' | 'category' | 'city';
}

const quickFilters = [
  { icon: Clock, label: 'Full-time', filter: 'type', value: 'Full-time' },
  { icon: Clock, label: 'Part-time', filter: 'type', value: 'Part-time' },
  { icon: Briefcase, label: 'Contract', filter: 'type', value: 'Contract' },
];

export function RightSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hotCompanies, setHotCompanies] = useState<HotCompany[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [cities, setCities] = useState<FilterOption[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  
  // Get selected values from URL (support multiple values)
  const selectedCategories = searchParams.getAll("category");
  const selectedCities = searchParams.getAll("city");

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const [statsResponse, filtersResponse] = await Promise.all([
          fetch('/api/jobs/stats'),
          fetch('/api/jobs/filters')
        ]);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setHotCompanies(statsData.hotCompanies || []);
          setMarketInsights(statsData.marketInsights || null);
        }
        
        if (filtersResponse.ok) {
          const filtersData = await filtersResponse.json();
          setCategories(filtersData.categories || []);
          setCities(filtersData.cities || []);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleFilterClick = (filterType: string, filterValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Remove search query when filtering
    params.delete("q");
    
    // Handle filters
    const currentValue = params.get(filterType);
    if (currentValue === filterValue) {
      // Remove filter if already active
      params.delete(filterType);
    } else {
      // Set new filter
      params.set(filterType, filterValue);
    }
    
    // Navigate with new params
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  const handleMultiSelect = (filterType: 'category' | 'city', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    
    const currentValues = params.getAll(filterType);
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    // Remove all existing values
    params.delete(filterType);
    
    // Add new values
    newValues.forEach(v => params.append(filterType, v));
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  const removeFilter = (filterType: 'category' | 'city', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(filterType);
    const newValues = currentValues.filter(v => v !== value);
    
    params.delete(filterType);
    newValues.forEach(v => params.append(filterType, v));
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };
  
  const isFilterActive = (filterType: string, filterValue: string): boolean => {
    const currentValue = searchParams.get(filterType);
    return currentValue === filterValue;
  };

  const handleCompanyClick = (companyName: string) => {
    router.push(`/?q=${encodeURIComponent(companyName)}`);
  };

  return (
    <div className="space-y-4 sticky top-20">
      {/* Quick Filters */}
      <Card className="p-4 gap-0">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-600" />
          <h4>Quick Filters</h4>
        </div>
        
        {/* Type Filters */}
        <div className="mb-4">
          <p className="text-xs text-slate-600 mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={`${filter.filter}-${filter.value}`}
                variant={isFilterActive(filter.filter, filter.value) ? "default" : "outline"}
                size="sm"
                className="gap-1 text-xs"
                onClick={() => handleFilterClick(filter.filter, filter.value)}
              >
                <filter.icon className="w-3 h-3" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Multi-Select */}
        <div className="mb-4">
          <p className="text-xs text-slate-600 mb-2">Category</p>
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categoryOpen}
                className="w-full justify-between text-sm h-9"
              >
                <span className="truncate">
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} selected`
                    : "Select categories..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      "No category found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.value}
                        value={category.value}
                        onSelect={() => handleMultiSelect('category', category.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCategories.includes(category.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {category.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="text-xs"
                >
                  {cat}
                  <button
                    onClick={() => removeFilter('category', cat)}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* City Multi-Select */}
        <div>
          <p className="text-xs text-slate-600 mb-2">Location</p>
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                className="w-full justify-between text-sm h-9"
              >
                <span className="truncate">
                  {selectedCities.length > 0
                    ? `${selectedCities.length} selected`
                    : "Select locations..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search location..." />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      "No location found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.value}
                        value={city.value}
                        onSelect={() => handleMultiSelect('city', city.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCities.includes(city.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {city.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedCities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedCities.map((city) => (
                <Badge
                  key={city}
                  variant="secondary"
                  className="text-xs"
                >
                  {city}
                  <button
                    onClick={() => removeFilter('city', city)}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Hot Companies */}
      <Card className="p-4 gap-0">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h4>Hot Companies Hiring</h4>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : hotCompanies.length > 0 ? (
          <>
            <div className="space-y-2">
              {hotCompanies.map((company, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleCompanyClick(company.name)}
                >
                  <span className="text-sm">{company.name}</span>
                  <Badge variant="outline" className="text-xs">{company.jobs} jobs</Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">Tidak ada data</p>
        )}
      </Card>

      {/* Market Insights */}
      <Card className="p-4 gap-0">
        <h4 className="mb-3">Market Insights</h4>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : marketInsights ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-900 mb-1 text-sm font-medium">Most Demanded Skill</p>
              <p className="text-blue-600 text-sm">{marketInsights.mostDemandedSkill}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-900 mb-1 text-sm font-medium">Avg. Salary Growth</p>
              <p className="text-green-600 text-sm">{marketInsights.salaryGrowth} this quarter</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-purple-900 mb-1 text-sm font-medium">Top Location</p>
              <p className="text-purple-600 text-sm">{marketInsights.topLocation}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-900 mb-1 text-sm font-medium">Total Jobs</p>
              <p className="text-slate-600 text-sm">{marketInsights.totalJobs.toLocaleString('id-ID')} lowongan</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">Tidak ada data</p>
        )}
      </Card>
    </div>
  );
}
