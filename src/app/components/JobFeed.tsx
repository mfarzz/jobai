"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { JobCard } from './JobCard';
import { Loader2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  description: string;
  matchScore: number;
  type: string;
  posted: string;
  salary: string;
  url?: string;
  isHybrid?: boolean;
  isWfh?: boolean;
  skills?: string[];
}

export function JobFeed() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const categories = searchParams.getAll("category"); // Support multiple
  const cities = searchParams.getAll("city"); // Support multiple
  const remote = searchParams.get("remote") || "";
  
  // Memoize string representations for dependency arrays
  const categoriesKey = useMemo(() => categories.join(','), [categories]);
  const citiesKey = useMemo(() => cities.join(','), [cities]);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const LIMIT = 10;

  const fetchJobs = useCallback(async (
    currentOffset: number, 
    append: boolean = false, 
    query: string = "",
    filters: { type?: string; categories?: string[]; cities?: string[]; remote?: string } = {}
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.type) params.set("type", filters.type);
      if (filters.categories) {
        filters.categories.forEach(cat => params.append("category", cat));
      }
      if (filters.cities) {
        filters.cities.forEach(city => params.append("city", city));
      }
      if (filters.remote) params.set("remote", filters.remote);
      params.set("limit", LIMIT.toString());
      params.set("offset", currentOffset.toString());

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        const newJobs = data.jobs || [];
        
        if (append) {
          setJobs(prev => [...prev, ...newJobs]);
        } else {
          setJobs(newJobs);
        }

        // Check if there are more jobs to load
        setHasMore(newJobs.length === LIMIT);
        setOffset(currentOffset + newJobs.length);
      } else {
        setError(data.error || "Failed to fetch jobs");
      }
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Error fetching jobs:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load and when search query or filters change
  useEffect(() => {
    setOffset(0);
    setJobs([]);
    fetchJobs(0, false, searchQuery, { type, categories, cities, remote });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, type, categoriesKey, citiesKey, remote]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchJobs(offset, true, searchQuery, { type, categories, cities, remote });
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, offset, searchQuery, type, categoriesKey, citiesKey, remote]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Build filter display text
  const activeFilters: string[] = [];
  if (type) activeFilters.push(`Type: ${type}`);
  if (categories.length > 0) activeFilters.push(`Category: ${categories.join(', ')}`);
  if (cities.length > 0) activeFilters.push(`Location: ${cities.join(', ')}`);
  if (remote === 'true') activeFilters.push('Remote');

  return (
    <div className="space-y-4">
      {/* Search Results Header */}
      {(searchQuery || activeFilters.length > 0) && (
        <div className="mb-4">
          {searchQuery && (
            <p className="text-sm text-slate-600">
              Menampilkan hasil untuk: <span className="font-semibold text-slate-900">&quot;{searchQuery}&quot;</span>
            </p>
          )}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-sm text-slate-600">Filter:</span>
              {activeFilters.map((filter, idx) => (
                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {filter}
                </span>
              ))}
            </div>
          )}
          {jobs.length > 0 && !isLoading && (
            <p className="text-sm text-slate-500 mt-2">
              {jobs.length} hasil ditemukan
            </p>
          )}
        </div>
      )}

      {jobs.length > 0 ? (
        <>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          
          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-4">
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
            {!hasMore && jobs.length > 0 && (
              <p className="text-center text-slate-500 py-4">
                Tidak ada lowongan lagi
              </p>
            )}
          </div>
        </>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-2">
            {searchQuery 
              ? `Tidak ada lowongan ditemukan untuk &quot;${searchQuery}&quot;` 
              : "Tidak ada lowongan ditemukan."}
          </p>
          {searchQuery && (
            <p className="text-sm text-slate-400">
              Coba gunakan kata kunci yang berbeda
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
