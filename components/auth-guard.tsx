"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";

const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/sign-up"]);

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = pathname ? PUBLIC_ROUTES.has(pathname) : false;

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.replace("/sign-in");
    }
    // Note: Authenticated users on public routes are handled by the page components themselves
    // (e.g., home page redirects to appropriate dashboard)
  }, [loading, user, isPublicRoute, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return null;
  }

  // Allow authenticated users on public routes (they will be redirected by page logic)
  return <>{children}</>;
}
