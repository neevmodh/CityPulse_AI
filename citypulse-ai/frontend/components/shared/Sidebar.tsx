"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, PlusCircle, List, Map,
  BarChart2, ClipboardList, CheckSquare,
  Activity, AlertTriangle, ChevronRight,
  Users, Flame, Wrench,
} from "lucide-react";
import type { Role } from "@/types";

interface SidebarProps { role: Role; }

const SIDEBAR_ITEMS: Record<Role, { label: string; href: string; icon: React.ElementType; badge?: string }[]> = {
  citizen: [
    { label: "Dashboard",    href: "/citizen/dashboard", icon: LayoutDashboard },
    { label: "Report Issue", href: "/citizen/report",    icon: PlusCircle      },
    { label: "My Issues",    href: "/citizen/track",     icon: List            },
  ],
  worker: [
    { label: "Dashboard",    href: "/worker/dashboard",  icon: LayoutDashboard },
    { label: "Issue Queue",  href: "/worker/issues",     icon: ClipboardList   },
    { label: "Resolved",     href: "/worker/resolved",   icon: CheckSquare     },
  ],
  admin: [
    { label: "City Overview",href: "/admin/dashboard",   icon: LayoutDashboard },
    { label: "All Issues",   href: "/admin/issues",      icon: ClipboardList   },
    { label: "Hotspot Map",  href: "/admin/hotspots",    icon: Flame           },
    { label: "Analytics",   href: "/admin/analytics",   icon: BarChart2       },
    { label: "Workers",      href: "/admin/workers",     icon: Users           },
  ],
};

const ROLE_META: Record<Role, { label: string; color: string; iconColor: string; accent: string }> = {
  citizen: { label: "Citizen Portal",  color: "text-blue-600",   iconColor: "text-blue-500",   accent: "bg-blue-50"   },
  worker:  { label: "Officer Portal",  color: "text-green-600",  iconColor: "text-green-500",  accent: "bg-green-50"  },
  admin:   { label: "Admin Console",   color: "text-violet-600", iconColor: "text-violet-500", accent: "bg-violet-50" },
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items    = SIDEBAR_ITEMS[role];
  const meta     = ROLE_META[role];

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 min-h-screen sticky top-16">
      {/* Portal header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${meta.iconColor}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {items.map((item, i) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <motion.div
              key={`${item.href}-${item.label}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? `${meta.accent} ${meta.color} font-semibold`
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${
                  active ? meta.iconColor : "text-gray-400 group-hover:text-gray-600"
                }`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
                {active && <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${meta.iconColor}`} />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span>Ahmedabad Municipal</span>
        </div>
      </div>
    </aside>
  );
}
