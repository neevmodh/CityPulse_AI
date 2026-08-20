"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import type { Role } from "@/types";

interface RoleGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  /** Redirect target if not authenticated (default: /login) */
  redirectTo?: string;
}

/**
 * Client-side role guard. Redirects to login if unauthenticated,
 * or to /demo if the user's role is not in allowedRoles.
 */
export default function RoleGate({ allowedRoles, children, redirectTo = "/login" }: RoleGateProps) {
  const router  = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace(redirectTo);
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their correct portal
      const portals: Record<Role, string> = {
        citizen: "/citizen/dashboard",
        worker:  "/worker/dashboard",
        admin:   "/admin/dashboard",
      };
      router.replace(portals[user.role]);
      return;
    }
    setOk(true);
  }, [allowedRoles, redirectTo, router]);

  if (ok === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Checking access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
