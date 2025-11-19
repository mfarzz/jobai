"use client";

import { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { JobFeed } from './components/JobFeed';
import { RightSidebar } from './components/RightSidebar';
import { Footer } from './components/Footer';
import { Button } from './components/ui/button';
import { ArrowUp } from 'lucide-react';

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than 300px
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      
      <div className="max-w-[1440px] mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">
          {/* Left Sidebar - User Overview */}
          <aside className="lg:col-span-3">
            <LeftSidebar />
          </aside>

          {/* Center Content - Main Job Feed */}
          <main className="lg:col-span-6">
            <JobFeed />
          </main>

          {/* Right Sidebar - Trends & Filters */}
          <aside className="lg:col-span-3">
            <RightSidebar />
          </aside>
        </div>
      </div>

      <Footer />

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up"
          size="icon"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
