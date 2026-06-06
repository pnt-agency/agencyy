"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Star, ShieldCheck, Users, Briefcase, Zap, ArrowRight, Globe, Clock, Award } from "lucide-react";

/* ─── Particle Canvas (Black & White) ─── */
function ParticleCanvas({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const dotColor = dark ? "255,255,255" : "10,10,10";
    const lineColor = dark ? "255,255,255" : "10,10,10";

    const particles: {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.4 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${lineColor},${0.06 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [started, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Scroll Reveal ─── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── Step ─── */
function Step({ n, title, desc, last = false }: { n: number; title: string; desc: string; last?: boolean }) {
  return (
    <div className="reveal flex gap-5 group" style={{ transitionDelay: `${(n - 1) * 120}ms` }}>
      <div className="flex flex-col items-center shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center font-display font-black text-lg border-2 border-white/20 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-300 shadow-lg">
          {n}
        </div>
        {!last && <div className="w-px flex-1 bg-white/15 mt-3" />}
      </div>
      <div className="pb-10">
        <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-white/80 transition-colors">{title}</h3>
        <p className="text-white/55 leading-relaxed text-[15px]">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Home ─── */
export default function Home() {
  useScrollReveal();
  const [tab, setTab] = useState<"employers" | "talent">("employers");

  const defaultReviews = [
    {
      quote: "Agency Build completely transformed how we hire. We found an incredible Virtual Assistant within 48 hours who was already trained on core values.",
      name: "Sarah Jenkins",
      title: "CEO at TechStart",
      init: "SJ",
      featured: false,
      type: "employer",
    },
    {
      quote: "The Verified Badge process is no joke, our Project Manager hit the ground running on day one. Best hire we've made this year, bar none.",
      name: "Marcus Thompson",
      title: "COO at GrowthLabs",
      init: "MT",
      featured: true,
      type: "employer",
    },
    {
      quote: "Three months in and our remote team feels like family. Agency Build matched us with talent that aligned perfectly with our culture.",
      name: "Amara Osei",
      title: "Founder at Bloom Digital",
      init: "AO",
      featured: false,
      type: "employer",
    },
  ];

  const [reviews, setReviews] = useState(defaultReviews);

  useEffect(() => {
    const savedReviews = localStorage.getItem("agency-build-reviews");
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        console.error("Failed to parse reviews", e);
      }
    }
  }, []);

  const [newReview, setNewReview] = useState({ name: "", title: "", quote: "", rating: 5, type: "employer" as "employer" | "talent" });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.quote) return;
    const init = newReview.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "RV";
    
    const updatedReviews = [{ ...newReview, init, featured: false }, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem("agency-build-reviews", JSON.stringify(updatedReviews));
    
    setNewReview({ name: "", title: "", quote: "", rating: 5, type: "employer" });
  };

  return (
    <div className="flex flex-col w-full">

      {/* ══════════════════════════════════════
          HERO  –  white bg, black text
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen bg-white flex items-center overflow-hidden">
        <ParticleCanvas dark={false} />

        {/* Subtle geometric rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] border border-black/4 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] border border-black/6 rounded-full animate-spin-reverse pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border border-black/8 rounded-full animate-spin-slow pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* LEFT */}
            <div>
              {/* Pill badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 border border-black/15 rounded-full px-4 py-2 mb-8 bg-black/3">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-blink" />
                <span className="text-black text-sm font-semibold">Top 1% Verified Talent Network</span>
              </div>

              <h1 className="animate-fade-up delay-100 font-display text-6xl lg:text-[80px] font-black text-black leading-[1.0] tracking-tight mb-7">
                Build your<br />
                <span className="inline-block border-b-4 border-black pb-1">dream team</span><br />
                <span className="text-black/30">with verified</span><br />
                <span className="text-black/30">remote talent.</span>
              </h1>

              <p className="animate-fade-up delay-200 text-[17px] text-black/55 max-w-lg mb-10 leading-relaxed">
                We screen, train, and verify top professionals globally so you can hire with total confidence, matched in 48 hours or less.
              </p>

              <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3">
                <Link href="/hire">
                  <button className="group flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-black/85 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/20 text-base">
                    Hire Talent Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/apply">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-black/15 text-black font-semibold rounded-2xl hover:border-black hover:bg-black/4 transition-all duration-300 text-base">
                    Apply as Talent
                  </button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="animate-fade-up delay-400 flex items-center gap-5 mt-10">
                <div className="flex -space-x-2.5">
                  {["S","A","M","J","K"].map((l, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-black flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[0,1,2,3,4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-black text-black" />)}
                  </div>
                  <p className="text-xs text-black/50">Trusted by <span className="text-black font-semibold">500+ companies</span> worldwide</p>
                </div>
              </div>
            </div>

            {/* RIGHT – floating cards */}
            <div className="hidden lg:block relative h-[540px]">
              {/* Main card */}
              <div className="absolute top-6 left-4 right-4 bg-black text-white rounded-3xl p-6 shadow-2xl shadow-black/30 animate-float-slow">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-white font-display font-bold">Latest Matches</span>
                  <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full font-semibold border border-white/15">
                    ● 48h matched
                  </span>
                </div>
                {[
                  { init: "S", name: "Sarah A.", role: "Virtual Assistant" },
                  { init: "J", name: "James K.", role: "Project Manager" },
                  { init: "A", name: "Amara O.", role: "Content Writer" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 py-3 border-b border-white/8 last:border-0 hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shrink-0">
                      {p.init}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{p.name}</div>
                      <div className="text-white/50 text-xs">{p.role}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      Verified
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats card */}
              <div className="absolute bottom-28 right-2 bg-white border-2 border-black/10 rounded-2xl px-5 py-4 shadow-xl animate-float-medium" style={{ animationDelay: "1s" }}>
                <div className="text-3xl font-display font-black text-black">98%</div>
                <div className="text-xs text-black/50 font-medium mt-0.5">Client Satisfaction</div>
              </div>

              {/* Badge card */}
              <div className="absolute bottom-6 left-6 bg-black text-white rounded-2xl px-4 py-3 shadow-xl animate-float-slow" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold">Verified Badge</span>
                </div>
                <div className="text-white/50 text-xs mt-0.5">5-Module Training Passed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/8" />
      </section>

      {/* ══════════════════════════════════════
          STATS STRIP  –  white bg
      ══════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-black/8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-5 h-5" />,   val: 500, suffix: "+", label: "Placements Made" },
              { icon: <Clock className="w-5 h-5" />,   val: 48,  suffix: "h", label: "Average Match Time" },
              { icon: <Globe className="w-5 h-5" />,   val: 30,  suffix: "+", label: "Countries Served" },
              { icon: <Award className="w-5 h-5" />,   val: 98,  suffix: "%", label: "Client Satisfaction" },
            ].map((s, i) => (
              <div
                key={i}
                className="reveal group text-center p-6 rounded-2xl border border-black/8 hover:border-black/20 hover:bg-black/2 transition-all duration-300 cursor-default"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-black/5 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                  {s.icon}
                </div>
                <div className="text-3xl font-display font-black text-black mb-1">
                  <AnimatedCounter target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-xs text-black/45 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SCROLLING MARQUEE STRIP
      ══════════════════════════════════════ */}
      <section className="py-5 bg-black overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, rep) =>
            ["Vetted Skills", "Verified Badge", "48-Hour Placement", "Global Talent", "5-Module Training", "98% Satisfaction", "Integrity First", "Excellence Always"].map((t) => (
              <span key={`${rep}-${t}`} className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-6">
                {t} <span className="text-white/15">✦</span>
              </span>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY US  –  white bg, black text
      ══════════════════════════════════════ */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <div className="reveal inline-flex items-center gap-2 border border-black/15 rounded-full px-4 py-1.5 mb-5 bg-black/3">
              <span className="text-black text-xs font-bold uppercase tracking-widest">Why Agency Build</span>
            </div>
            <h2 className="reveal font-display text-5xl font-black text-black leading-tight mb-4">
              The standard for<br />remote talent.
            </h2>
            <p className="reveal text-black/50 text-lg leading-relaxed">
              Our rigorous process ensures you only work with the absolute best professionals, every single time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Vetted Skills",
                desc: "Every candidate undergoes extensive technical and communication assessments before joining our verified network.",
                tag: "Multi-stage screening",
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: "Verified Badge",
                desc: "Our Verified Badge means the talent has passed our proprietary 5-module integrity and excellence training program.",
                tag: "5-Module certified",
                featured: true,
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Fast Placement",
                desc: "Stop sifting through hundreds of resumes. We match you with the perfect verified professional in 48 hours, not weeks.",
                tag: "48-hour guarantee",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`reveal hover-lift group relative rounded-3xl p-8 border-2 transition-all duration-300 cursor-default overflow-hidden ${
                  card.featured
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/10 hover:border-black/30"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Icon */}
                <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  card.featured
                    ? "bg-white/10 text-white group-hover:bg-white group-hover:text-black"
                    : "bg-black/6 text-black group-hover:bg-black group-hover:text-white"
                }`}>
                  {card.icon}
                </div>

                <h3 className={`font-display text-xl font-bold mb-3 ${card.featured ? "text-white" : "text-black"}`}>
                  {card.title}
                </h3>
                <p className={`leading-relaxed mb-6 text-[15px] ${card.featured ? "text-white/60" : "text-black/50"}`}>
                  {card.desc}
                </p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border ${
                  card.featured
                    ? "border-white/20 text-white bg-white/8"
                    : "border-black/12 text-black bg-black/4"
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {card.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS  –  black bg, white text
      ══════════════════════════════════════ */}
      <section className="py-28 bg-black relative overflow-hidden">
        <ParticleCanvas dark={true} />

        {/* Rings */}
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/4 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] border border-white/6 rounded-full animate-spin-reverse pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">

            {/* Left: heading + tab */}
            <div>
              <div className="reveal inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 mb-6 bg-white/5">
                <span className="text-white text-xs font-bold uppercase tracking-widest">The Process</span>
              </div>
              <h2 className="reveal font-display text-5xl font-black text-white leading-tight mb-6">
                How it<br />works.
              </h2>
              <p className="reveal text-white/45 text-lg leading-relaxed mb-10 max-w-sm">
                A simple, fast process designed for both employers and talented professionals.
              </p>

              {/* Tab toggle */}
              <div className="reveal flex gap-2 p-1.5 bg-white/8 border border-white/10 rounded-2xl w-fit mb-10">
                {(["employers", "talent"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      tab === t
                        ? "bg-white text-black shadow-lg"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t === "employers" ? <Briefcase className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {t === "employers" ? "For Employers" : "For Talent"}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <div className="reveal">
                <Link href={tab === "employers" ? "/hire" : "/apply"}>
                  <button className="group flex items-center gap-2 px-7 py-3.5 bg-white text-black font-bold rounded-2xl hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-xl shadow-white/10">
                    {tab === "employers" ? "Start Hiring" : "Apply Now"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: steps */}
            <div className="pt-2">
              {tab === "employers" ? (
                <>
                  <Step n={1} title="Share your needs" desc="Fill out a quick inquiry telling us about the role, budget, and requirements. Takes less than 5 minutes." />
                  <Step n={2} title="Meet your match" desc="We handpick 2–3 verified candidates that perfectly fit your criteria and company culture within 48 hours." />
                  <Step n={3} title="Hire and scale" desc="Interview, hire, and start working immediately. We handle initial onboarding and ongoing support." last />
                </>
              ) : (
                <>
                  <Step n={1} title="Apply & Screen" desc="Submit your application and go through our thorough initial screening to evaluate your skills and experience." />
                  <Step n={2} title="Train & Verify" desc="Complete our 5-module training program to earn your coveted Verified Badge and stand out from the crowd." />
                  <Step n={3} title="Get Placed" desc="We match you with top global companies actively seeking your specific skill set and expertise." last />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS  –  white bg
      ══════════════════════════════════════ */}
      <section className="py-28 bg-white border-t border-black/8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <div className="reveal inline-flex items-center gap-2 border border-black/15 rounded-full px-4 py-1.5 mb-5 bg-black/3">
              <Star className="w-3 h-3 fill-black text-black" />
              <span className="text-black text-xs font-bold uppercase tracking-widest">Success Stories</span>
            </div>
            <h2 className="reveal font-display text-5xl font-black text-black leading-tight">
              Don't just take<br />our word for it.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((t, i) => (
              <div
                key={i}
                className={`reveal hover-lift group rounded-3xl p-8 border-2 transition-all duration-300 cursor-default ${
                  t.featured
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/10 hover:border-black/25"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[0,1,2,3,4].map((j) => (
                    <Star key={j} className={`w-4 h-4 fill-current ${t.featured ? "text-white" : "text-black"}`} />
                  ))}
                </div>

                <blockquote className={`leading-relaxed mb-7 text-[15px] ${t.featured ? "text-white/70" : "text-black/55"}`}>
                  "{t.quote}"
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ${
                    t.featured ? "bg-white text-black" : "bg-black text-white"
                  }`}>
                    {t.init}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`font-display font-bold text-sm ${t.featured ? "text-white" : "text-black"}`}>{t.name}</div>
                      {t.type && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border ${
                          t.featured 
                            ? "bg-white/10 border-white/20 text-white/80" 
                            : "bg-black/5 border-black/10 text-black/60"
                        }`}>
                          {t.type === "employer" ? "Employer" : "Talent"}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 ${t.featured ? "text-white/45" : "text-black/40"}`}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Review Form */}
          <div className="max-w-2xl mx-auto mt-24 p-8 border border-black/10 rounded-3xl bg-black/2 reveal">
            <div className="text-center mb-6">
              <h3 className="font-display text-2xl font-bold text-black mb-2">Leave a Review</h3>
              <p className="text-black/50 text-sm">Share your experience with Agency Build.</p>
            </div>
            
            <div className="flex gap-2 p-1.5 bg-black/5 border border-black/10 rounded-2xl w-fit mx-auto mb-8">
              {(["employer", "talent"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, type: t })}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    newReview.type === t
                      ? "bg-white text-black shadow-md border border-black/5"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  {t === "employer" ? <Briefcase className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  {t === "employer" ? "As Employer" : "As Talent"}
                </button>
              ))}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Full Name</label>
                  <input required value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-black bg-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">{newReview.type === "employer" ? "Role / Company" : "Role / Title"}</label>
                  <input value={newReview.title} onChange={e => setNewReview({...newReview, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-black bg-white" placeholder={newReview.type === "employer" ? "CEO at TechCorp" : "Virtual Assistant"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none hover:scale-110 transition-transform cursor-pointer">
                      <Star className={`w-7 h-7 ${star <= newReview.rating ? "fill-black text-black" : "text-black/20"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Your Experience</label>
                <textarea required value={newReview.quote} onChange={e => setNewReview({...newReview, quote: e.target.value})} rows={4} className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-black resize-none bg-white" placeholder={newReview.type === "employer" ? "How was your match?" : "How was the placement process?"}></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-black/85 transition-all shadow-lg shadow-black/15">Submit Review</button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA  –  black bg, white text
      ══════════════════════════════════════ */}
      <section className="py-32 bg-black relative overflow-hidden">
        <ParticleCanvas dark={true} />

        {/* Animated rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/4 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full animate-spin-reverse pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/6 rounded-full animate-spin-slow pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="reveal inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 mb-8 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
            <span className="text-white text-sm font-semibold">Accepting new clients now</span>
          </div>

          <h2 className="reveal font-display text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Ready to hire your<br />
            <span className="text-shimmer-bw">perfect match?</span>
          </h2>

          <p className="reveal text-white/45 text-xl mb-12 max-w-lg mx-auto leading-relaxed">
            Join hundreds of companies who found their ideal remote talent through Agency Build.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hire">
              <button className="group flex items-center justify-center gap-2 px-10 py-5 bg-white text-black font-black rounded-2xl text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-2xl shadow-white/10">
                Start Hiring Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/apply">
              <button className="flex items-center justify-center gap-2 px-10 py-5 border-2 border-white/20 text-white font-bold rounded-2xl text-lg hover:border-white/50 hover:bg-white/5 transition-all duration-300">
                Join as Talent
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
