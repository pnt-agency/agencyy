"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Mail, KeyRound, User, Briefcase } from "lucide-react";
import { registerMember } from "@/app/auth-actions";

type Mode = "signin" | "signup";
type Role = "talent" | "employer";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("talent");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await registerMember({ name, email, password, role });
        if (!result.success) {
          setError(result.error);
          return;
        }
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          mode === "signup"
            ? "Account created, but sign-in failed. Please try logging in."
            : "Invalid email or password."
        );
        return;
      }

      router.push(mode === "signup" ? "/profile-setup" : "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
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
            {["S", "M", "T"].map((l, i) => (
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
            <h2 className="text-3xl font-display font-bold mb-2">
              {mode === "signup" ? "Create your account" : "Welcome Back"}
            </h2>
            <p className="text-white/50">
              {mode === "signup"
                ? "Join the network in less than a minute"
                : "Sign in to continue to your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up">
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-1.5 text-white/80">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-semibold mb-1.5 text-white/80">I am a...</span>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "talent", label: "Talent", icon: User },
                      { value: "employer", label: "Employer", icon: Briefcase },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          role === opt.value
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/70 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5 text-white/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5 text-white/80">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white placeholder:text-white/30"
                />
              </div>
            </div>

            {mode === "signin" && (
              <div className="text-right -mt-1">
                <Link href="/forgot-password" className="text-sm text-white/60 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p role="alert" className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                ? "Create Account"
                : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-white/40 text-sm">OR</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full mt-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-white/50">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
              }}
              className="font-semibold text-white hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p className="mt-6 text-center text-xs text-white/30 max-w-xs mx-auto">
            By continuing, you agree to Agency Build&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
