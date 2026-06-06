"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { signOut, getSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to Agency Build! Complete your profile.", time: "1h ago", read: false },
    { id: 2, text: "New job matches available for your skills.", time: "3h ago", read: false },
    { id: 3, text: "Your recent application was viewed.", time: "1d ago", read: false },
  ]);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user-email");
    localStorage.removeItem("user-role");
    localStorage.removeItem("user-name");
    try {
      await signOut({ redirect: false });
    } catch(e) {}
    window.location.href = "/";
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const email = localStorage.getItem("user-email");
      if (email) {
        setIsLoggedIn(true);
        return;
      }
      const session = await getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkAuth();
  }, [pathname]);

  const isDarkBg = pathname === "/";
  const textColorClass = isDarkBg && !scrolled ? "text-white" : "text-black";
  const logoBgClass = isDarkBg && !scrolled ? "bg-white text-black" : "bg-black text-white";

  const homeHref = isLoggedIn ? "/home" : "/";

  const links = [
    { href: homeHref, label: "Home" },
    { href: "/about", label: "About" },
    { href: "/apply", label: "For Talent" },
    { href: "/hire", label: "For Employers" },
    { href: "/training", label: "Training" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-black/10 shadow-sm py-3"
            : "bg-white/0 py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2 group">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md ${logoBgClass}`}>
              <span className="font-black text-xs tracking-tight">AB</span>
            </div>
            <span className={`text-lg font-display font-bold tracking-tight ${textColorClass}`}>
              Agency<span className="font-black">Build</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`relative text-sm font-medium transition-colors duration-200 group ${isDarkBg && !scrolled ? "text-white/70 hover:text-white" : "text-black/60 hover:text-black"}`}
              >
                {l.label}
                <span className={`absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${isDarkBg && !scrolled ? "bg-white" : "bg-black"}`} />
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            {pathname !== "/" && (
              <>
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-full transition-all duration-300 relative group ${isDarkBg && !scrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-black/60 hover:text-black hover:bg-black/5"} ${showNotifications ? "bg-black/5" : ""}`}
                  >
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                      <div className="flex items-center justify-between p-4 border-b border-black/5 bg-gray-50/50">
                        <h4 className="font-bold text-black text-sm">Notifications</h4>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-black/5 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer relative ${notif.read ? "opacity-60" : "bg-blue-50/30"}`}
                            >
                              <div className="pr-8">
                                <p className={`text-sm ${notif.read ? "text-gray-600" : "text-black font-medium"}`}>
                                  {notif.text}
                                </p>
                                <span className="text-xs text-gray-400 mt-1.5 block">{notif.time}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => deleteNotification(e, notif.id)}
                                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all bg-white shadow-sm border border-black/5 z-10"
                              >
                                <X className="w-3.5 h-3.5 pointer-events-none" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500 text-sm">
                            You're all caught up!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/apply">
                  <button className={`px-5 py-2 text-sm font-semibold border rounded-xl transition-all duration-300 ${isDarkBg && !scrolled ? "text-white border-white/30 hover:border-white hover:bg-white/10" : "text-black border-black/20 hover:border-black hover:bg-black/5"}`}>
                    Apply as Talent
                  </button>
                </Link>
              </>
            )}
            {isLoggedIn && pathname !== "/" && (
              <>
                <Link href="/hire">
                  <button className={`px-5 py-2 text-sm font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-md ${isDarkBg && !scrolled ? "text-black bg-white hover:bg-white/90" : "text-white bg-black hover:bg-black/80"}`}>
                    Hire Talent →
                  </button>
                </Link>
                <button 
                  onClick={() => setShowLogoutPrompt(true)}
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 hover:scale-105 transition-all duration-300 shadow-md"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 flex flex-col gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 transition-all duration-300 origin-center ${isDarkBg && !scrolled ? "bg-white" : "bg-black"} ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 transition-all duration-300 ${isDarkBg && !scrolled ? "bg-white" : "bg-black"} ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-6 h-0.5 transition-all duration-300 origin-center ${isDarkBg && !scrolled ? "bg-white" : "bg-black"} ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <nav className="mx-4 mt-2 bg-white border border-black/10 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-black/70 hover:text-black transition-colors border-b border-black/5 pb-3 last:border-0 last:pb-0"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-black/10">
              {pathname !== "/" && (
                <Link href="/apply" onClick={() => setMenuOpen(false)}>
                  <button className="w-full py-2.5 text-sm font-semibold text-black border border-black/20 rounded-xl hover:bg-black/5">Apply as Talent</button>
                </Link>
              )}
              {isLoggedIn && pathname !== "/" && (
                <>
                  <Link href="/hire" onClick={() => setMenuOpen(false)}>
                    <button className="w-full py-2.5 text-sm font-bold text-white bg-black rounded-xl">Hire Talent →</button>
                  </Link>
                  <button 
                    onClick={() => setShowLogoutPrompt(true)}
                    className="w-full py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Logout Prompt Modal */}
      {showLogoutPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-black mb-2">Sign out</h3>
            <p className="text-black/60 text-sm mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutPrompt(false)}
                className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-black font-semibold rounded-xl transition-colors"
              >
                No, cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
