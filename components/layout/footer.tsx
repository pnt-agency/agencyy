"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { openCookieSettings } from "@/components/cookie-consent/cookie-banner";

export function Footer() {
  // Reading the session on the client, the way the navbar does, rather than
  // making this an async server component. A server-side session read touches
  // cookies, which would opt every marketing page out of static prerendering
  // just to decide whether one link renders.
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  // Labels deliberately match the navbar's for the same routes. When a page is
  // called "For Employers" up top and "Hire Talent" down here, there's no way
  // for a visitor to tell it's the same destination.
  const platformLinks = [
    { href: "/hire", label: "For Employers" },
    { href: "/apply", label: "For Talent" },
    { href: "/about", label: "About" },
    // Members only: /training redirects signed-out visitors to the sign-in
    // page, and signed-out visitors are most of who reads a footer.
    ...(isLoggedIn ? [{ href: "/training", label: "Training" }] : []),
  ];

  return (
    <footer className="bg-black text-white">
      {/* Top border line */}
      <div className="gold-rule" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand column */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="Amaris Partners — home" className="group inline-flex mb-5">
              <Image
                src="/brand/amaris-logo-horizontal-on-dark.svg"
                alt="Amaris Partners"
                width={210}
                height={70}
                sizes="144px"
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Connecting screened, trained, and verified remote talent with companies worldwide. Excellence and integrity in every placement.
            </p>
          </div>

          {/* Platform links */}
          <div className="md:col-span-3">
            <h3 className="text-gold font-display font-bold mb-5 text-sm uppercase tracking-widest">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-gold transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="md:col-span-2">
            <h3 className="text-gold font-display font-bold mb-5 text-sm uppercase tracking-widest">Legal</h3>
            <ul className="space-y-3">
              {[
                // Four documents on two pages; see app/privacy and app/terms.
                { href: "/privacy",                 label: "Privacy Policy" },
                { href: "/privacy#cookie-policy",   label: "Cookie Policy" },
                { href: "/terms#terms-of-use",      label: "Terms of Use" },
                { href: "/terms#user-agreement",    label: "User Agreement" },
                // No admin entry point here on purpose: it never logged anyone
                // in (/admin redirects non-admins to the sign-in page), and an
                // admin already reaches it from their dashboard.
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-gold transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* The Cookie Policy (3.2) names this control and its place in
                  the footer; it reopens the consent banner's settings. */}
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-sm text-white/50 hover:text-gold transition-colors duration-200 flex items-center gap-2 group cursor-pointer"
                >
                  <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                  Privacy &amp; Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          {/* CTA box */}
          <div className="md:col-span-2">
            <div className="border border-gold/30 rounded-2xl p-5 text-center bg-gold/5">
              <div className="text-2xl mb-3 text-gold">✦</div>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">Ready to find your perfect match?</p>
              <Link href="/hire">
                <button className="w-full py-2.5 text-xs font-bold text-black bg-gold rounded-xl hover:bg-gold/90 transition-all">
                  Get Started →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gold/20 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Amaris Partners. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Built for remote teams worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
