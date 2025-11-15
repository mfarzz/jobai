import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { JobFeed } from './components/JobFeed';
import { RightSidebar } from './components/RightSidebar';
import { Footer } from './components/Footer';

export default function Home() {
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
    </div>
  );
}
