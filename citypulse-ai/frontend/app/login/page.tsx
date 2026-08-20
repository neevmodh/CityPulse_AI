"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, LogIn } from "lucide-react";
import { authApi } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  { label: "Citizen",  email: "arjun@demo.com",  role: "citizen" },
  { label: "Officer",  email: "rajesh@demo.com", role: "worker"  },
  { label: "Admin",    email: "admin@demo.com",  role: "admin"   },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      saveSession(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      // Redirect by role
      const routes: Record<string, string> = {
        citizen: "/citizen/dashboard",
        worker:  "/worker/dashboard",
        admin:   "/admin/dashboard",
      };
      router.push(routes[data.user.role] ?? "/demo");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    setEmail(email);
    setPassword("demo123");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CityPulse AI</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your municipal account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
              Quick demo login
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="flex-1 text-xs py-1.5 px-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-gray-600 font-medium"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 uppercase">
              <span className="bg-white px-2">or sign in manually</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Want to try without signing in?{" "}
          <Link href="/demo" className="text-green-600 hover:text-green-700 font-medium">
            Use demo mode
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
