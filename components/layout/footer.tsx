import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Top border line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand column */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-black font-black text-xs">AB</span>
              </div>
              <span className="text-xl font-display font-bold text-white tracking-tight">
                AgencyBuild
              </span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Connecting screened, trained, and verified remote talent with companies worldwide. Excellence and integrity in every placement.
            </p>
          </div>

          {/* Platform links */}
          <div className="md:col-span-3">
            <h3 className="text-white font-display font-bold mb-5 text-sm uppercase tracking-widest">Platform</h3>
            <ul className="space-y-3">
              {[
                { href: "/hire",     label: "Hire Talent" },
                { href: "/apply",    label: "Apply as Talent" },
                { href: "/about",    label: "About Us" },
                { href: "/training", label: "Talent Training" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="md:col-span-2">
            <h3 className="text-white font-display font-bold mb-5 text-sm uppercase tracking-widest">Legal</h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms",   label: "Terms of Service" },
                { href: "/admin",   label: "Admin Login" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA box */}
          <div className="md:col-span-2">
            <div className="border border-white/10 rounded-2xl p-5 text-center bg-white/5">
              <div className="text-2xl mb-3">✦</div>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">Ready to find your perfect match?</p>
              <Link href="/hire">
                <button className="w-full py-2.5 text-xs font-bold text-black bg-white rounded-xl hover:bg-white/90 transition-all">
                  Get Started →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Agency Build. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Built for remote teams worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
