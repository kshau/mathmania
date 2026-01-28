"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  BarChart3,
  BookOpen,
  Shield,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { auth } from "@/lib/firebase";

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isAdmin, profile } = useUserProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isParent = profile?.type === "parent";
  const isChild = profile?.type === "child" || !profile?.type; // Default to child if type is undefined
  const isLandingPage = pathname === "/";

  // Only show navigation items for child users on non-landing pages
  const navItems =
    isChild && !isLandingPage
      ? [
          { href: "/child", label: "Home", icon: Home },
          { href: "/schedule", label: "Schedule", icon: Calendar },
          { href: "/dashboard", label: "Progress", icon: BarChart3 },
          { href: "/resources", label: "Resources", icon: BookOpen },
        ]
      : [];

  return (
    <nav className="border-b border-border bg-card relative z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
              MathMania
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              Welcome to the World of Math
            </span>
          </Link>

          {/* Navigation Links - Only shown for child users */}
          {navItems.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    size="lg"
                    className="text-sm xl:text-base gap-1 xl:gap-2 px-2 xl:px-4"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 xl:h-5 xl:w-5" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {user ? (
              <>
                {!isLandingPage && (
                  <Button variant="ghost" size="lg" asChild>
                    <Link href="/settings">
                      <Settings className="h-5 w-5 mr-2" />
                      Settings
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      await signOut(auth);
                    } finally {
                      setIsSigningOut(false);
                    }
                  }}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </Button>
              </>
            ) : (
              <Button size="lg" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
          {/* Mobile Sign Out */}
          <div className="lg:hidden">
            {user ? (
              <Button
                size="sm"
                className="flex-col h-auto py-2 sm:py-3 gap-0.5 sm:gap-1 min-w-[60px]"
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await signOut(auth);
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
                disabled={isSigningOut}
              >
                <span className="text-[10px] sm:text-xs">
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </span>
              </Button>
            ) : (
              !isLandingPage && (
                <Button
                  asChild
                  size="sm"
                  className="flex-col h-auto py-2 sm:py-3 gap-0.5 sm:gap-1 min-w-[60px]"
                >
                  <Link href="/sign-in">
                    <span className="text-[10px] sm:text-xs">Sign in</span>
                  </Link>
                </Button>
              )
            )}
          </div>

        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-around pb-3 sm:pb-4 gap-1 sm:gap-2 overflow-x-auto">
          {/* Show nav items only for child users */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="flex-1 flex-col h-auto py-2 sm:py-3 gap-0.5 sm:gap-1 min-w-[60px]"
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[10px] sm:text-xs">{item.label}</span>
                </Link>
              </Button>
            );
          })}
          {user && !isLandingPage && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex-1 flex-col h-auto py-2 sm:py-3 gap-0.5 sm:gap-1 min-w-[60px]"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs">Settings</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
