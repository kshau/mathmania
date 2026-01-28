"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
