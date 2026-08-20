"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, Wrench, Building2, LogIn,
  Shield, CheckCircle2, ChevronRight, Lock,
} from "lucide-react";
import { setDemoSession } from "@/lib/auth";
import toast from "react-hot-toast";

const ROLES = [
  {
    id: "citizen" as const,
    emoji: "👤",
    title: "Citizen",
    persona: "Arjun Mehta",
    location: "Ward 7 – Chandkheda",
    tagline: "Report. Track. Impact.",
    description:
      "Experience the citizen journey — snap a photo, watch AI analyze it in real-time, and track your report through resolution.",
    features: [
      "Report issues with photo + GPS",
      "Real-time AI analysis pipeline",
      "Live status tracking",
      "Ward-level map view",
    ],
    href: "/citizen/dashboard",
    demo_email: "arjun@demo.com",
    gradient: "from-[#2563eb] via-[#3b82f6] to-[#0ea5e9]",
    glow: "rgba(59,130,246,0.35)",
    badge: "bg-blue-500/20 text-blue-200 border-blue-400/30",
    icon: Users,
    accent: "#3b82f6",
  },
  {
    id: "worker" as const,
    emoji: "🔧",
    title: "Field Worker",
    persona: "Rajesh Kumar",
    location: "Roads Dept · AMC",
    tagline: "AI-Prioritized Queue.",
    description:
      "Manage an AI-sorted repair queue. Get full issue context, upload resolution evidence, and track your SLA in real-time.",
    features: [
      "AI priority queue (P1–P4)",
      "Full issue context + analysis",
      "Before/after photo upload",
      "SLA timer tracking",
    ],
    href: "/worker/dashboard",
    demo_email: "rajesh@demo.com",
    gradient: "from-[#059669] via-[#10b981] to-[#34d399]",
    glow: "rgba(16,185,129,0.35)",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    icon: Wrench,
    accent: "#10b981",
  },
  {
    id: "admin" as const,
    emoji: "🏛️",
    title: "Administrator",
    persona: "Anita Singh",
    location: "AMC Control Room",
    tagline: "City-Wide Intelligence.",
    description:
      "Monitor Ahmedabad's urban health in real time. Hotspot detection, ward analytics, and AI-powered department insights.",
    features: [
      "Live City Health Score",
      "Hotspot risk detection map",
      "Ward-level analytics",
      "Department performance KPIs",
    ],
    href: "/admin/dashboard",
    demo_email: "admin@demo.com",
    gradient: "from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]",
    glow: "rgba(139,92,246,0.35)",
    badge: "bg-violet-500/20 text-violet-200 border-violet-400/30",
    icon: Building2,
    accent: "#8b5cf6",
  },
];

function RoleCard({
  role,
  index,
  onSelect,
  isLoading,
}: {
  role: (typeof ROLES)[0];
  index: number;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = role.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group cursor-pointer"
      onClick={onSelect}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute -inset-px rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, ${role.glow}, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: hovered ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          boxShadow: hovered ? `0 16px 48px ${role.glow}` : "none",
        }}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${role.gradient} p-6 relative overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 30%, white 1px, transparent 1px), radial-gradient(circle at 30% 70%, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${role.badge}`}
              >
                {role.tagline}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{role.emoji}</span>
              <h2 className="text-xl font-bold text-white">{role.title}</h2>
            </div>
            <p className="text-white/70 text-xs font-medium">
              {role.persona} · {role.location}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 text-sm leading-relaxed mb-5">{role.description}</p>

          <ul className="space-y-2.5 mb-6">
            {role.features.map((f, fi) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.12 + fi * 0.05 }}
                className="flex items-center gap-2.5 text-sm text-gray-300"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: role.accent }} />
                {f}
              </motion.li>
            ))}
          </ul>

          {/* Credentials */}
          <div
            className="rounded-xl p-3 mb-4 font-mono text-xs space-y-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex justify-between">
              <span className="text-gray-500">email</span>
              <span className="text-gray-300">{role.demo_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">password</span>
              <span className="text-gray-300">demo123</span>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r ${role.gradient} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in…
              </>
            ) : (
              <>
                Enter as {role.title}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleSelect = async (role: "citizen" | "worker" | "admin", href: string) => {
    setLoadingRole(role);
    setDemoSession(role);
    toast.success(`✓ Logged in as ${role} — demo mode`, {
      style: {
        background: "#18181b",
        color: "#f4f4f5",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
      },
    });
    await new Promise((r) => setTimeout(r, 600));
    router.push(href);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: "#09090b" }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute top-[-15%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2.5 text-gray-300 text-xs font-semibold px-4 py-2 rounded-full mb-6"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Demo · No sign-up needed · Prototype data
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            Try{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #4ade80, #34d399, #2dd4bf)",
              }}
            >
              CityPulse AI
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Choose your role to explore the prototype. Each view is pre-loaded with realistic Ahmedabad data.
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {ROLES.map((role, i) => (
            <RoleCard
              key={role.id}
              role={role}
              index={i}
              isLoading={loadingRole === role.id}
              onSelect={() => handleSelect(role.id, role.href)}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            All accounts use password:{" "}
            <code
              className="text-gray-400 font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              demo123
            </code>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Prototype data — not real government data
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <a
            href="/login"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in with real account
          </a>
        </motion.div>
      </div>
    </main>
  );
}
