"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Activity, Zap, Shield, Users, BarChart2,
  CheckCircle, AlertTriangle, Clock, MapPin, Camera,
  Brain, Eye, Network, GitBranch,
} from "lucide-react";
import AnimatedCounter from "@/components/shared/AnimatedCounter";

// ─── Urban Pulse Bar ──────────────────────────────────────────────────────────
function PulseBar() {
  return <div className="urban-pulse-bar fixed top-0 left-0 right-0 z-[100]" />;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <nav className="fixed top-[3px] left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900 text-lg tracking-tight">CityPulse AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-green-600 transition-colors">How It Works</a>
          <a href="#roles"        className="hover:text-green-600 transition-colors">Roles</a>
          <a href="#ai"           className="hover:text-green-600 transition-colors">AI</a>
          <a href="#categories"   className="hover:text-green-600 transition-colors">Features</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Sign In
          </Link>
          <Link href="/demo" className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
            Try Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Section 1 — Hero ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-28 pb-20 px-4 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
            Urban Digital Immune System · Ahmedabad
          </motion.div>

          <h1 className="font-display text-[56px] sm:text-[64px] font-bold text-gray-900 leading-[1.08] mb-6">
            The City That<br />
            <span className="text-green-600">Fixes Itself.</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
            CityPulse AI converts citizen observations into prioritized municipal action — automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/citizen/report"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-7 py-3.5 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-green-200 hover:shadow-lg"
            >
              Report an Issue
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 px-7 py-3.5 rounded-lg font-semibold text-base transition-all"
            >
              Try Demo
            </Link>
          </div>

          {/* Mini trust signals */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />No sign-up for demo</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />Real AI analysis</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />10 wards covered</span>
          </div>
        </motion.div>

        {/* Right — Animated City SVG */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex items-center justify-center"
        >
          <CitySVG />
        </motion.div>
      </div>
    </section>
  );
}

function CitySVG() {
  return (
    <div className="relative w-full max-w-[520px]">
      {/* Main SVG Cityscape */}
      <svg viewBox="0 0 520 380" className="w-full" xmlns="http://www.w3.org/2000/svg">
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>
          <linearGradient id="bldGreen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="bldLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="bldMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Sky */}
        <rect width="520" height="380" fill="url(#skyGrad)" rx="16"/>

        {/* Road */}
        <rect x="0" y="310" width="520" height="70" fill="#e2e8f0" rx="0"/>
        <rect x="0" y="308" width="520" height="4" fill="#d1d5db"/>
        {/* Road markings */}
        {[40,120,200,280,360,440].map(x => (
          <rect key={x} x={x} y="338" width="40" height="4" fill="white" opacity="0.6" rx="2"/>
        ))}

        {/* Building 1 — tall dark green */}
        <rect x="30" y="120" width="70" height="192" fill="url(#bldGreen)" rx="4"/>
        <rect x="30" y="115" width="70" height="12" fill="#15803d" rx="2"/>
        {/* Windows */}
        {[0,1,2,3,4,5,6,7].map(row => [0,1,2].map(col => (
          <rect key={`b1-${row}-${col}`} x={40+col*20} y={135+row*22} width="10" height="14"
            fill={Math.random()>0.3?"#bbf7d0":"#052e16"} opacity="0.9" rx="1"/>
        )))}
        {/* Antenna */}
        <line x1="65" y1="115" x2="65" y2="88" stroke="#15803d" strokeWidth="2"/>
        <circle cx="65" cy="86" r="4" fill="#22c55e" filter="url(#glow)"/>

        {/* Building 2 — medium light */}
        <rect x="120" y="170" width="55" height="142" fill="url(#bldLight)" rx="4"/>
        <rect x="120" y="165" width="55" height="10" fill="#16a34a" rx="2"/>
        {[0,1,2,3,4,5].map(row => [0,1].map(col => (
          <rect key={`b2-${row}-${col}`} x={130+col*22} y={182+row*22} width="12" height="14"
            fill={Math.random()>0.4?"#f0fdf4":"#15803d"} opacity="0.9" rx="1"/>
        )))}

        {/* Building 3 — wide mid */}
        <rect x="195" y="150" width="80" height="162" fill="url(#bldMid)" rx="4"/>
        <rect x="195" y="144" width="80" height="12" fill="#86efac" rx="2"/>
        {[0,1,2,3,4,5,6].map(row => [0,1,2,3].map(col => (
          <rect key={`b3-${row}-${col}`} x={203+col*18} y={162+row*20} width="10" height="12"
            fill={Math.random()>0.35?"#14532d":"#dcfce7"} opacity="0.9" rx="1"/>
        )))}

        {/* Building 4 — slim tall */}
        <rect x="295" y="105" width="48" height="207" fill="url(#bldGreen)" rx="4"/>
        <rect x="295" y="100" width="48" height="10" fill="#15803d" rx="2"/>
        {[0,1,2,3,4,5,6,7,8].map(row => [0,1].map(col => (
          <rect key={`b4-${row}-${col}`} x={303+col*20} y={116+row*22} width="11" height="14"
            fill={Math.random()>0.3?"#4ade80":"#052e16"} opacity="0.9" rx="1"/>
        )))}
        <line x1="319" y1="100" x2="319" y2="72" stroke="#15803d" strokeWidth="2"/>
        <circle cx="319" cy="70" r="5" fill="#4ade80" filter="url(#glow)"/>

        {/* Building 5 */}
        <rect x="363" y="185" width="58" height="127" fill="url(#bldLight)" rx="4"/>
        <rect x="363" y="180" width="58" height="10" fill="#16a34a" rx="2"/>
        {[0,1,2,3,4].map(row => [0,1,2].map(col => (
          <rect key={`b5-${row}-${col}`} x={371+col*16} y={196+row*22} width="10" height="14"
            fill={Math.random()>0.4?"#f0fdf4":"#15803d"} opacity="0.85" rx="1"/>
        )))}

        {/* Building 6 */}
        <rect x="440" y="155" width="65" height="157" fill="url(#bldMid)" rx="4"/>
        <rect x="440" y="149" width="65" height="10" fill="#86efac" rx="2"/>
        {[0,1,2,3,4,5,6].map(row => [0,1,2].map(col => (
          <rect key={`b6-${row}-${col}`} x={448+col*18} y={165+row*20} width="11" height="12"
            fill={Math.random()>0.35?"#14532d":"#dcfce7"} opacity="0.9" rx="1"/>
        )))}

        {/* Street trees */}
        {[90,175,255,345,425].map((x, i) => (
          <g key={`tree-${i}`}>
            <rect x={x+4} y="292" width="4" height="18" fill="#15803d"/>
            <circle cx={x+6} cy="286" r="10" fill="#22c55e" opacity="0.85"/>
          </g>
        ))}

        {/* Hazard pulsing dots on buildings */}
        <circle cx="80" cy="240" r="6" fill="#ef4444" opacity="0.9" filter="url(#glow)">
          <animate attributeName="r" values="5;9;5" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="230" cy="200" r="5" fill="#f97316" opacity="0.9" filter="url(#glow)">
          <animate attributeName="r" values="4;8;4" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="320" cy="270" r="5" fill="#22c55e" opacity="0.9" filter="url(#glow)">
          <animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="460" cy="220" r="6" fill="#eab308" opacity="0.9" filter="url(#glow)">
          <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
        </circle>

        {/* Connection lines between hazards — the "network" feel */}
        <line x1="80" y1="240" x2="230" y2="200" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="4 4">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.5s" repeatCount="indefinite"/>
        </line>
        <line x1="230" y1="200" x2="320" y2="270" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="4 4">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite"/>
        </line>
        <line x1="320" y1="270" x2="460" y2="220" stroke="#22c55e" strokeWidth="1" opacity="0.3" strokeDasharray="4 4">
          <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite"/>
        </line>
      </svg>

      {/* Floating status cards */}
      <motion.div
        className="float-card absolute top-8 right-4 bg-white border border-red-200 rounded-xl px-3 py-2 shadow-lg text-xs font-medium"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full pulse-dot"/>
          <span className="text-gray-800">🔴 Pothole — P1 Critical</span>
        </div>
        <div className="text-gray-400 mt-0.5 font-mono text-[10px]">Chandkheda · Risk 88</div>
      </motion.div>

      <motion.div
        className="float-card-delay absolute bottom-20 right-2 bg-white border border-green-200 rounded-xl px-3 py-2 shadow-lg text-xs font-medium"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full"/>
          <span className="text-gray-800">🟢 Resolved — Ward 3</span>
        </div>
        <div className="text-gray-400 mt-0.5 font-mono text-[10px]">2.4 hrs · Verified ✓</div>
      </motion.div>

      <motion.div
        className="float-card absolute top-28 left-2 bg-white border border-blue-200 rounded-xl px-3 py-2 shadow-lg text-xs font-medium"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-blue-600 animate-pulse"/>
          <span className="text-gray-800">⚡ AI Analyzing…</span>
        </div>
        <div className="text-gray-400 mt-0.5 font-mono text-[10px]">Gemini + YOLOv8</div>
      </motion.div>
    </div>
  );
}

// ─── Section 2 — Stats Bar ────────────────────────────────────────────────────
const STATS = [
  { value: 48,   suffix: "+", label: "Issues Tracked",   decimals: 0 },
  { value: 94,   suffix: "%", label: "AI Accuracy",       decimals: 0 },
  { value: 3,    suffix: "",  label: "User Roles",        decimals: 0 },
  { value: 10,   suffix: "",  label: "Wards Covered",     decimals: 0 },
];

function StatsBar() {
  const ref    = useRef(null);
  return (
    <section ref={ref} className="bg-green-950 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="font-display text-4xl font-bold text-white mb-1">
              <AnimatedCounter to={s.value} suffix={s.suffix} decimals={s.decimals} />
            </div>
            <div className="text-green-300 text-sm font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 3 — Problem Statement ───────────────────────────────────────────
const PROBLEMS = [
  {
    icon: "📋",
    title: "Fragmented Reports",
    body: "Thousands of reports across WhatsApp, calls, and forms. No unified view. No priority. No tracking.",
  },
  {
    icon: "⏳",
    title: "Delayed Action",
    body: "Manual triage means critical issues wait in queues. Officers have no context on what to fix first.",
  },
  {
    icon: "❓",
    title: "No Verification",
    body: "Issues get marked 'resolved' with no proof it was actually fixed. Citizens never get closure.",
  },
];

function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">
            Cities Have Complaints.<br className="hidden sm:block"/> Not Intelligence.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
        {/* Quote block */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-l-4 border-green-500 pl-6 py-2"
        >
          <p className="font-display text-xl sm:text-2xl font-semibold text-gray-800 leading-relaxed">
            &quot;The problem isn&apos;t that cities lack complaints.<br />
            The problem is cities lack <span className="text-green-600">intelligence</span><br />
            between observation and action.&quot;
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}

// ─── Section 4 — How It Works ─────────────────────────────────────────────────
const STEPS = [
  { num: "01", title: "Citizen reports hazard",      desc: "Photo + GPS location + description. Takes 30 seconds from any device.",      icon: Camera   },
  { num: "02", title: "AI detects issue & severity", desc: "YOLOv8 road detection + Gemini 1.5 Flash vision classify the issue instantly.", icon: Eye       },
  { num: "03", title: "Risk Engine scores urgency",  desc: "0–100 score weighing severity, location, exposure, recurrence & weather.",    icon: Zap       },
  { num: "04", title: "Officer gets action queue",   desc: "Municipal officer receives a prioritized list with full AI context attached.", icon: Shield    },
  { num: "05", title: "Officer repairs & uploads",   desc: "Before/after photos uploaded as evidence of completion.",                     icon: CheckCircle},
  { num: "06", title: "AI verifies the fix",         desc: "DINOv2 embeddings + Gemini confirm the after-photo shows real resolution.",   icon: Brain     },
  { num: "07", title: "Citizen gets closure",        desc: "Real-time status update. Resolution proof visible on citizen dashboard.",     icon: Users     },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-green-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 text-lg">SENSE → UNDERSTAND → PRIORITIZE → ACT → VERIFY → LEARN</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="font-mono text-3xl font-bold text-green-200 leading-none">{step.num}</span>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon className="w-4 h-4 text-green-600" />
                    <h3 className="font-display font-semibold text-gray-900 text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 5 — Role Cards ───────────────────────────────────────────────────
function RoleCards() {
  return (
    <section id="roles" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">Built for Everyone</h2>
          <p className="text-gray-500 text-lg">Three portals. One connected city.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl border-2 border-green-100 bg-green-50 p-7 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 transition-all"
          >
            <div className="text-4xl mb-4">📱</div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Report Once.<br/>Know What Happened.</h3>
            <ul className="space-y-2 mb-6 text-sm text-gray-600">
              {["Easy photo report", "Real-time status tracking", "Resolution proof"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 border border-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-all">
              Start Reporting <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </motion.div>

          {/* Worker */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="rounded-2xl bg-green-600 p-7 text-white shadow-xl hover:bg-green-700 transition-all"
          >
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="font-display font-bold text-xl mb-2">Know What to Fix First.<br/>And Why.</h3>
            <ul className="space-y-2 mb-6 text-sm text-green-100">
              {["AI priority queue", "Risk reasoning per issue", "Assignment tools"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-white hover:bg-green-50 px-4 py-2 rounded-lg transition-all">
              Officer Login <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </motion.div>

          {/* Admin */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-green-950 p-7 text-white shadow-xl hover:bg-green-900 transition-all"
          >
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="font-display font-bold text-xl mb-2">See Where the City<br/>Is Becoming Risky.</h3>
            <ul className="space-y-2 mb-6 text-sm text-green-300">
              {["City health score", "Ward hotspot map", "Department analytics"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-950 bg-green-400 hover:bg-green-300 px-4 py-2 rounded-lg transition-all">
              Admin Login <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6 — AI Capabilities ─────────────────────────────────────────────
const AI_CARDS = [
  { icon: "🎯", name: "YOLOv8 Road Detection",  desc: "Pretrained on 10,000+ road damage images. Detects potholes, cracks, and alligator damage with 94% confidence.",  color: "border-red-200 hover:border-red-400" },
  { icon: "👁️", name: "Gemini 1.5 Flash Vision", desc: "Multimodal AI classifies any civic issue, estimates severity, recommends action, and generates officer briefings.", color: "border-blue-200 hover:border-blue-400" },
  { icon: "⚡", name: "Risk Intelligence Engine", desc: "6-factor scoring: severity, exposure, location, recurrence, weather, and frequency. Outputs P1–P4 priority.", color: "border-yellow-200 hover:border-yellow-400" },
  { icon: "🧬", name: "DINOv2 Similarity",        desc: "Facebook's vision transformer detects duplicate reports and verifies resolutions by comparing embeddings.",        color: "border-purple-200 hover:border-purple-400" },
];

function AISection() {
  return (
    <section id="ai" className="py-20 px-4 bg-green-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block bg-green-900 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Real AI — Not Demo Buttons
          </span>
          <h2 className="font-display text-4xl font-bold text-white mb-3">Powered by Real AI</h2>
          <p className="text-green-300 text-lg">Four models working together in one pipeline.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {AI_CARDS.map((card, i) => (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-green-900/60 border-2 ${card.color} rounded-2xl p-6 glow-hover transition-all`}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{card.name}</h3>
              <p className="text-green-300 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 7 — Categories ───────────────────────────────────────────────────
const CATEGORIES = [
  { emoji: "🚧", label: "Potholes & Cracks" },
  { emoji: "💧", label: "Waterlogging"       },
  { emoji: "🗑️", label: "Waste & Garbage"   },
  { emoji: "🕳️", label: "Open Manholes"     },
  { emoji: "💡", label: "Broken Lights"      },
  { emoji: "🌳", label: "Fallen Trees"       },
  { emoji: "🚶", label: "Damaged Footpaths"  },
  { emoji: "🚨", label: "Road Hazards"       },
  { emoji: "⚡", label: "Electrical Risk"    },
  { emoji: "💦", label: "Water Leaks"        },
  { emoji: "🚦", label: "Traffic Signals"    },
  { emoji: "🏞️", label: "Park Damage"       },
];

function CategoriesSection() {
  return (
    <section id="categories" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-gray-900 mb-3">What CityPulse Detects</h2>
          <p className="text-gray-500 text-lg">12 issue categories. All automatically classified by AI.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-400 text-green-800 text-sm font-medium px-4 py-2.5 rounded-full cursor-default transition-all"
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 8 — Live Demo CTA ────────────────────────────────────────────────
function DemoCTA() {
  return (
    <section className="py-20 px-4 bg-green-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">See It In Action</h2>
          <p className="text-green-100 text-xl mb-10">
            Choose your role and explore CityPulse AI right now.<br className="hidden sm:block"/>
            No sign-up. No download. Just pick and go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {[
              { emoji: "👤", label: "Try as Citizen", role: "citizen" },
              { emoji: "🔧", label: "Try as Worker",  role: "worker"  },
              { emoji: "🏛️", label: "Try as Admin",   role: "admin"   },
            ].map((r) => (
              <Link
                key={r.role}
                href="/demo"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-700 hover:bg-green-50 px-7 py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-xl"
              >
                <span>{r.emoji}</span>
                {r.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 9 — Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">CityPulse AI</span>
            </div>
            <p className="text-green-400 text-sm font-medium mb-1">Urban Digital Immune System</p>
            <p className="text-gray-500 text-xs">Built for Ahmedabad · AMC Integration Ready</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <Link href="/citizen/report" className="hover:text-green-400 transition-colors">Report Issue</Link>
            <Link href="/demo"           className="hover:text-green-400 transition-colors">Demo</Link>
            <Link href="/login"          className="hover:text-green-400 transition-colors">Sign In</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">GitHub</a>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            Prototype — uses simulated data for demonstration purposes only.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
            System Operational
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <PulseBar />
      <LandingNav />
      <Hero />
      <StatsBar />
      <ProblemSection />
      <HowItWorks />
      <RoleCards />
      <AISection />
      <CategoriesSection />
      <DemoCTA />
      <Footer />
    </main>
  );
}
