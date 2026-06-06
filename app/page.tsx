"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Mail, KeyRound } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep("code");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return;
    localStorage.setItem("user-email", email);
    router.push("/profile-setup");
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/profile-setup" });
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left side - visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-zinc-900 flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-black text-xl mb-6">
            AB
          </div>
          <h1 className="text-5xl font-display font-black leading-tight max-w-lg">
            Build your dream remote team, effortlessly.
          </h1>
        </div>

        <div className="relative z-10">
          <div className="flex -space-x-3 mb-4">
            {["S","M","T"].map((l,i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-zinc-900 bg-white text-black flex items-center justify-center font-bold text-sm">
                {l}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-sm max-w-md">Join over 500+ companies who have already scaled their operations using our verified talent network.</p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
            <p className="text-white/50">Sign in or create an account to continue</p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4 animate-fade-up">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-white/80">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="you@company.com" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                Continue with Email <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4 animate-fade-up">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-white/80">Verification Code</label>
                <p className="text-xs text-white/40 mb-3">We sent a 6-digit code to {email}</p>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={code} 
                    onChange={e => setCode(e.target.value)} 
                    placeholder="000000" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30 font-mono tracking-widest text-lg"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all">
                Verify & Login
              </button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-white/40 hover:text-white transition-colors">
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-white/40 text-sm">OR</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full mt-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="mt-10 text-center text-xs text-white/30 max-w-xs mx-auto">
            By continuing, you agree to Agency Build's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
