"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, User, CheckCircle2 } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [role, setRole] = useState<"employer" | "talent" | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [portfolio, setPortfolio] = useState("");

  useEffect(() => {
    const existingRole = localStorage.getItem("user-role") as "employer" | "talent" | null;
    if (existingRole) {
      setIsUpdating(true);
      setRole(existingRole);
      setName(localStorage.getItem("user-name") || "");
      setCompany(localStorage.getItem("user-company") || "");
      setPhone(localStorage.getItem("user-phone") || "");
      setLocation(localStorage.getItem("user-location") || "");
      setBio(localStorage.getItem("user-bio") || "");
      setSkills(localStorage.getItem("user-skills") || "");
      setPortfolio(localStorage.getItem("user-portfolio") || "");
    }
  }, []);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name) return;
    localStorage.setItem("user-role", role);
    localStorage.setItem("user-name", name);
    localStorage.setItem("user-company", company);
    localStorage.setItem("user-phone", phone);
    localStorage.setItem("user-location", location);
    localStorage.setItem("user-bio", bio);
    localStorage.setItem("user-skills", skills);
    localStorage.setItem("user-portfolio", portfolio);
    
    // After profile setup or update, go back to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 py-24">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 p-10 animate-fade-up">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-5">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-black text-black mb-2">
            {isUpdating ? "Update your profile" : "Complete your profile"}
          </h1>
          <p className="text-gray-500">
            {isUpdating ? "Keep your information up to date to get the best matches." : "Tell us a bit about yourself to personalize your experience."}
          </p>
        </div>

        <form onSubmit={handleComplete} className="space-y-8">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">How will you use Agency Build?</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setRole("employer")}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  role === "employer" ? "border-black bg-black/5" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <Briefcase className={`w-6 h-6 mb-3 ${role === "employer" ? "text-black" : "text-gray-400"}`} />
                <h3 className={`font-bold ${role === "employer" ? "text-black" : "text-gray-700"}`}>I'm an Employer</h3>
                <p className="text-xs text-gray-500 mt-1">Looking to hire verified talent</p>
                {role === "employer" && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-black" />}
              </button>
              
              <button 
                type="button" 
                onClick={() => setRole("talent")}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  role === "talent" ? "border-black bg-black/5" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <User className={`w-6 h-6 mb-3 ${role === "talent" ? "text-black" : "text-gray-400"}`} />
                <h3 className={`font-bold ${role === "talent" ? "text-black" : "text-gray-700"}`}>I'm a Talent</h3>
                <p className="text-xs text-gray-500 mt-1">Looking for remote opportunities</p>
                {role === "talent" && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-black" />}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Location / Country</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="United States" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              
              {role === "employer" ? (
                <div className="animate-fade-up">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Corp" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              ) : (
                <div className="animate-fade-up">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Portfolio / LinkedIn URL</label>
                  <input 
                    type="url" 
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                    placeholder="https://linkedin.com/in/..." 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              )}
            </div>

            {role === "talent" && (
              <div className="animate-fade-up space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Primary Skills</label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. React, Next.js, UI/UX Design, Project Management" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Short Bio</label>
              <textarea 
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={role === "employer" ? "Tell us about your company and what kind of talent you are looking for..." : "Tell us a bit about your experience and what you excel at..."}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black bg-gray-50 focus:bg-white transition-all resize-none"
              />
            </div>

          </div>

          <button 
            type="submit" 
            disabled={!role || !name}
            className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isUpdating ? "Save Changes" : "Complete Setup"}
          </button>

        </form>
      </div>
    </div>
  );
}
