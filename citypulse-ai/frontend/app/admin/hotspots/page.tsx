"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity, BarChart2, Map as MapIcon,
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, ArrowRight, RefreshCw,
  Flame, Info, Users,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import { dashboardApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Hotspot } from "@/types";
import toast from "react-hot-toast";

const HotspotMap = dynamic(() => import("@/components/maps/HotspotMap"), { ssr: false });

const ADMIN_NAV = [
  { label: "Overview",  href: "/admin/dashboard",  icon: Activity  },
  { label: "Issues",    href: "/admin/issues",      icon: MapIcon   },
  { label: "Hotspots",  href: "/admin/hotspots",    icon: MapIcon   },
  { label: "Analytics", href: "/admin/analytics",   icon: BarChart2 },
  { label: "Workers",   href: "/admin/workers",     icon: Users     },
];

const SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  critical: {
    border: "border-red-300",
    bg:     "hover:bg-red-50",
    badge:  "bg-red-100 text-red-700 border-red-200",
    dot:    "bg-red-500",
  },
  high: {
    border: "border-orange-200",
    bg:     "hover:bg-orange-50",
    badge:  "bg-orange-100 text-orange-700 border-orange-200",
    dot:    "bg-orange-500",
  },
  medium: {
    border: "border-yellow-200",
    bg:     "hover:bg-yellow-50",
    badge:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot:    "bg-yellow-500",
  },
};

const TREND_ICON = {
  rising:   { icon: TrendingUp,   color: "text-red-500",   label: "Rising"   },
  stable:   { icon: Minus,        color: "text-gray-400",  label: "Stable"   },
  declining:{ icon: TrendingDown, color: "text-green-500", label: "Declining"},
  critical: { icon: Flame,        color: "text-red-600",   label: "Critical" },
};

function HotspotCard({
  hotspot, index, selected, onSelect,
}: {
  hotspot: Hotspot; index: number;
  selected: boolean; onSelect: () => void;
}) {
  const styles  = SEVERITY_STYLES[hotspot.severity] ?? SEVERITY_STYLES.medium;
  const trend   = TREND_ICON[(hotspot.trend as keyof typeof TREND_ICON) ?? "stable"] ?? TREND_ICON.stable;
  const TrendIc = trend.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onSelect}
      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${styles.border} ${styles.bg} ${
        selected ? "ring-2 ring-green-400 ring-offset-1" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${styles.dot}`} />
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{hotspot.name ?? `${hotspot.ward} Hotspot`}</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${styles.badge}`}>
          {hotspot.severity?.toUpperCase()}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-gray-900">{hotspot.issue_count}</div>
          <div className="text-[10px] text-gray-400">Issues</div>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-gray-900">{hotspot.avg_risk_score}</div>
          <div className="text-[10px] text-gray-400">Avg Risk</div>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <div className={`text-sm font-bold flex items-center justify-center gap-0.5 ${trend.color}`}>
            <TrendIc className="w-3.5 h-3.5" />
          </div>
          <div className="text-[10px] text-gray-400">{trend.label}</div>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100 capitalize">
          {hotspot.dominant_category?.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-gray-400">{hotspot.ward}</span>
      </div>

      {/* Prediction */}
      {hotspot.prediction && (
        <div className="bg-white/70 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-gray-600 leading-relaxed">{hotspot.prediction}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/admin/analytics?ward=${hotspot.ward_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 py-1.5 rounded-lg transition-all"
        >
          Inspect
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); toast("Alert created for " + hotspot.ward, { icon: "🔔" }); }}
          className="flex-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 py-1.5 rounded-lg transition-all"
        >
          Create Alert
        </button>
      </div>
    </motion.div>
  );
}

export default function HotspotsPage() {
  const [hotspots,  setHotspots]  = useState<Hotspot[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [refreshing,setRefreshing]= useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const dash = await dashboardApi.admin();
      setHotspots(dash.hotspots ?? []);
    } catch { console.error("Failed to load hotspots"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedHotspot = hotspots.find(h => h.id === selected);

  return (
    <RoleGate allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">

          <aside className="hidden lg:flex flex-col w-56 sidebar-dark min-h-screen sticky top-16">
            <div className="px-4 py-5 border-b" style={{ borderColor: "hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Admin Console</span>
              </div>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2">
              {ADMIN_NAV.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`nav-item ${item.href === "/admin/hotspots" ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main split layout */}
          <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

            {/* Left panel — hotspot cards */}
            <div className="w-full lg:w-96 flex flex-col bg-white border-r border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h1 className="font-display font-bold text-gray-900">Risk Hotspots</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{hotspots.length} active hotspot clusters</p>
                </div>
                <button onClick={load} disabled={refreshing} className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Prototype disclaimer */}
              <div className="mx-4 mt-3 flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-700">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span><strong>PROTOTYPE:</strong> Predictive data is simulated from historical patterns.</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                  ))
                ) : hotspots.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Flame className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hotspots detected.</p>
                  </div>
                ) : (
                  hotspots
                    .sort((a, b) => Number(b.avg_risk_score) - Number(a.avg_risk_score))
                    .map((hs, i) => (
                      <HotspotCard
                        key={hs.id}
                        hotspot={hs}
                        index={i}
                        selected={selected === hs.id}
                        onSelect={() => setSelected(prev => prev === hs.id ? null : hs.id)}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Right — Map */}
            <div className="flex-1 relative">
              {selectedHotspot && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 right-4 z-10 bg-white border border-green-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedHotspot.name}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedHotspot.prediction}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </motion.div>
              )}
              <HotspotMap
                hotspots={hotspots}
                height="100%"
                center={selectedHotspot
                  ? [Number(selectedHotspot.latitude), Number(selectedHotspot.longitude)]
                  : [23.0225, 72.5714]
                }
                zoom={selectedHotspot ? 14 : 12}
              />
            </div>
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
