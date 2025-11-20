"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/app/components/TopNav";
import { Footer } from "@/app/components/Footer";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Loader2, BookmarkX, MapPin, Briefcase } from "lucide-react";
import { Skeleton } from "@/app/components/ui/skeleton";

interface SavedJobItem {
  id: string;
  jobId: number;
  createdAt: string;
    job: {
      id: number;
      title: string;
      companyName: string | null;
    companyLogo: string | null;
      location: string | null;
      type: string | null;
      category: string | null;
      isWfh: boolean | null;
      isHybrid: boolean | null;
    shortDescription: string | null;
    createdAt: string;
  };
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/jobs/saved");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Gagal memuat daftar simpan");
        }
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat");
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (jobId: number, savedId: string) => {
    try {
      setProcessingId(savedId);
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menghapus simpan");
      }
      setItems((prev) => prev.filter((item) => item.id !== savedId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus simpan");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 pt-20 pb-12 flex-1 w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
            <p className="text-sm text-slate-600">
              Simpan pekerjaan impian kamu.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Cari Pekerjaan
          </Button>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm mb-4">{error}</div>
        )}

        {!loading && items.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Belum ada yang disimpan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Simpan pekerjaan yang kamu minati untuk dilihat kembali di sini.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {item.job.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.job.companyLogo}
                        alt={item.job.companyName || "Logo"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">
                        {(item.job.companyName || "C")[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
                      {item.job.category || "General"}
                    </p>
                    <CardTitle className="text-lg leading-snug text-slate-900">
                      {item.job.title}
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      {item.job.companyName || "Company"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnsave(item.jobId, item.id)}
                  disabled={processingId === item.id}
                  aria-label="Hapus simpanan"
                >
                  {processingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookmarkX className="h-4 w-4 text-slate-600" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {item.job.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {item.job.location}
                    </span>
                  )}
                  {item.job.type && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {item.job.type}
                    </span>
                  )}
                  {item.job.isWfh && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">Remote</span>}
                  {item.job.isHybrid && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Hybrid</span>}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/jobs/${item.jobId}`)}
                >
                  Lihat Detail
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
