"use client";

import { Briefcase, Bell, User, Clock, FileText, CheckCircle2, ChevronRight, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";

// NOTE: the stat numbers below are static demo data. Wiring real metrics
// (profile views, matches, success rate) is a tracked follow-up.
export function DashboardView({ name, role }: { name: string; role: string }) {
  const isTalent = role !== "employer";

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="animate-fade-up">
            <p className="text-gray-500 font-medium mb-1">Welcome back,</p>
            <h1 className="text-4xl font-display font-black text-black">
              {name}
            </h1>
          </div>
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-black font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <Link href={isTalent ? "/profile-setup" : "/hire"}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-black/90 transition-colors shadow-md">
                {isTalent ? "Update Profile" : "Post a Job"}
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-gray-500 font-medium text-sm">Profile Views</p>
            <h3 className="text-2xl font-bold text-black mt-1">1,248</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">+3</span>
            </div>
            <p className="text-gray-500 font-medium text-sm">{isTalent ? "Job Matches" : "Active Listings"}</p>
            <h3 className="text-2xl font-bold text-black mt-1">{isTalent ? "14" : "3"}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-up" style={{ animationDelay: "250ms" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">Steady</span>
            </div>
            <p className="text-gray-500 font-medium text-sm">{isTalent ? "Application Success Rate" : "Hire Success Rate"}</p>
            <h3 className="text-2xl font-bold text-black mt-1">94%</h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Feed) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">Recent Activity</h2>
                <button className="text-sm font-semibold text-gray-500 hover:text-black transition-colors">View All</button>
              </div>

              <div className="space-y-6">
                {[
                  { title: isTalent ? "Application Viewed" : "New Candidate Match", desc: isTalent ? "TechCorp Inc. viewed your application for Senior Developer." : "Alex J. matches your Senior Developer listing perfectly.", time: "2 hours ago", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                  { title: "Training Module Completed", desc: "You successfully completed 'Remote Work Best Practices'.", time: "1 day ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                  { title: "Profile Update", desc: "Your resume was successfully updated and synced.", time: "2 days ago", icon: User, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start group cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors">{item.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Side Panel) */}
          <div className="space-y-8">
            <div className="bg-black rounded-3xl p-8 text-white shadow-xl animate-fade-up" style={{ animationDelay: "350ms" }}>
              <h3 className="text-xl font-bold mb-2">Agency Build Pro</h3>
              <p className="text-white/70 text-sm mb-6">Unlock priority matching and premium analytics.</p>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors">
                Upgrade Now
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
              <h3 className="text-lg font-bold text-black mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: "My Profile", href: "/profile-setup" },
                  { label: "Messages", href: "#" },
                  { label: "Training Hub", href: "/training" },
                  { label: "Settings", href: "#" },
                ].map((link, i) => (
                  <Link key={i} href={link.href} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <span className="font-medium text-gray-700 group-hover:text-black">{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
