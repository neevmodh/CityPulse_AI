"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Bell, LogOut, Menu, X, ChevronDown,
  User, CheckCheck, ExternalLink, Loader2,
} from "lucide-react";
import { getUser, clearSession } from "@/lib/auth";
import { authApi, notificationsApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { User as UserType, Notification } from "@/types";
import { timeAgo } from "@/lib/utils";

const NAV_LINKS: Record<string, { label: string; href: string }[]> = {
  citizen: [
    { label: "Dashboard",    href: "/citizen/dashboard" },
    { label: "Report Issue", href: "/citizen/report"    },
    { label: "My Issues",    href: "/citizen/track"     },
  ],
  worker: [
    { label: "Dashboard",    href: "/worker/dashboard"  },
    { label: "Issue Queue",  href: "/worker/issues"     },
    { label: "Resolved",     href: "/worker/resolved"   },
  ],
  admin: [
    { label: "Overview",     href: "/admin/dashboard"   },
    { label: "Issues",       href: "/admin/issues"      },
    { label: "Hotspots",     href: "/admin/hotspots"    },
    { label: "Analytics",    href: "/admin/analytics"   },
    { label: "Workers",      href: "/admin/workers"     },
  ],
};

const ROLE_COLORS: Record<string, { badge: string; dot: string }> = {
  citizen: { badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"   },
  worker:  { badge: "bg-green-100 text-green-700", dot: "bg-green-500"  },
  admin:   { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
};

const NOTIF_ICONS: Record<string, string> = {
  assignment:    "🔔",
  status_update: "🔄",
  resolution:    "✅",
  alert:         "⚠️",
};

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]               = useState<UserType | null>(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [bellOpen, setBellOpen]       = useState(false);
  const [notifs, setNotifs]           = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll]   = useState(false);
  const bellRef  = useRef<HTMLDivElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) return;
    // Load notifications
    notificationsApi.get(u.id, u.role)
      .then(r => { setNotifs(r.notifications); setUnreadCount(r.unread_count); })
      .catch(() => {});
    // Poll every 30s
    const interval = setInterval(() => {
      notificationsApi.get(u.id, u.role)
        .then(r => { setNotifs(r.notifications); setUnreadCount(r.unread_count); })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearSession();
    toast.success("Logged out");
    router.push("/");
  };

  const handleMarkAll = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead(user.id);
      setNotifs(prev => prev.map(n => ({ ...n, read: "true" })));
      setUnreadCount(0);
    } catch {} finally { setMarkingAll(false); }
  };

  const handleMarkOne = async (id: string) => {
    await notificationsApi.markRead(id).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: "true" } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const links = user ? (NAV_LINKS[user.role] ?? []) : [];
  const roleStyle = user ? (ROLE_COLORS[user.role] ?? ROLE_COLORS.citizen) : ROLE_COLORS.citizen;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      {/* City pulse bar */}
      <div className="urban-pulse-bar" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? `/${user.role}/dashboard` : "/"} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-display font-bold text-gray-900 text-lg hidden sm:block tracking-tight">
            CityPulse <span className="text-green-600">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-0.5 ml-6">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                  {active && <span className="sr-only">(current)</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className={`relative p-2 rounded-xl transition-all ${bellOpen ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-100"}`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAll} disabled={markingAll}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50">
                            {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-400">
                            <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                            No notifications
                          </div>
                        ) : notifs.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOne(n.id)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${n.read === "false" ? "bg-green-50/50" : ""}`}
                          >
                            <span className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] ?? "🔔"}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold text-gray-800 leading-tight ${n.read === "false" ? "text-green-800" : ""}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {n.read === "false" && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all hover:bg-gray-50 ${dropOpen ? "bg-gray-50" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleStyle.badge}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-800 max-w-[100px] truncate leading-tight">{user.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleStyle.badge}`}>{user.role}</span>
                        </div>
                      </div>
                      {user.role !== "admin" && (
                        <Link
                          href={`/${user.role}/dashboard`}
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          My Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link href="/demo" className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-sm">
                Try Demo
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {user && menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 overflow-hidden"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === l.href ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
