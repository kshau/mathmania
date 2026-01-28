"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Play,
  Clock,
  Star,
  TrendingUp,
  Loader2,
  BookOpen,
  Users,
  Trophy,
  Target,
  Zap,
  Heart,
  Shield,
  Eye,
  Bell,
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAccessibility } from "@/contexts/accessibility-provider";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { AdminGuard } from "@/components/admin-guard";
import { parseDuration } from "@/lib/user-stats";

type UpcomingSession = {
  id: string;
  title: string;
  day: string;
  time: string;
  type: "tutoring" | "group";
  tutor: string;
  nextDate: Date;
};

// Landing Page Component
function LandingPage() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const { settings } = useAccessibility();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    if (!settings.reduceMotion) {
      window.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (!settings.reduceMotion) {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [settings.reduceMotion]);

  const features = [
    {
      icon: BookOpen,
      title: "Interactive Lessons",
      description:
        "Engaging math lessons designed to make learning fun and effective",
    },
    {
      icon: Users,
      title: "Live Tutoring",
      description: "Connect with expert tutors in one-on-one or group sessions",
    },
    {
      icon: Trophy,
      title: "Gamified Learning",
      description:
        "Earn XP, unlock achievements, and level up your math skills",
    },
    {
      icon: Target,
      title: "Personalized Progress",
      description: "Track your learning journey with detailed progress reports",
    },
    {
      icon: Zap,
      title: "Quick Quizzes",
      description:
        "Test your knowledge with interactive quizzes and challenges",
    },
    {
      icon: Heart,
      title: "Parent Dashboard",
      description:
        "Parents can monitor and support their child's learning journey",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Parallax Background Layers */}
      <div className="fixed inset-0 -z-10" style={{ top: 0 }}>
        {/* Base gradient layer */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
          style={{
            transform: settings.reduceMotion
              ? "none"
              : `translateY(${scrollY * 0.1}px)`,
          }}
        />

        {/* Animated shapes layer */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            transform: settings.reduceMotion
              ? "none"
              : `translateY(${scrollY * 0.2}px)`,
          }}
        >
          <div
            className={`absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl ${
              settings.reduceMotion ? "" : "animate-pulse"
            }`}
          />
          <div
            className={`absolute top-40 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl ${
              settings.reduceMotion ? "" : "animate-pulse"
            }`}
            style={{ animationDelay: "1s" }}
          />
          <div
            className={`absolute bottom-20 left-1/3 w-80 h-80 bg-pink-300 rounded-full blur-3xl ${
              settings.reduceMotion ? "" : "animate-pulse"
            }`}
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Floating math symbols */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            transform: settings.reduceMotion
              ? "none"
              : `translateY(${scrollY * 0.3}px)`,
          }}
        >
          <div
            className={`absolute top-1/4 left-1/4 text-6xl ${
              settings.reduceMotion ? "" : "animate-bounce"
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            +
          </div>
          <div
            className={`absolute top-1/3 right-1/4 text-6xl ${
              settings.reduceMotion ? "" : "animate-bounce"
            }`}
            style={{ animationDelay: "0.7s" }}
          >
            ×
          </div>
          <div
            className={`absolute bottom-1/3 left-1/3 text-6xl ${
              settings.reduceMotion ? "" : "animate-bounce"
            }`}
            style={{ animationDelay: "1s" }}
          >
            ÷
          </div>
          <div
            className={`absolute bottom-1/4 right-1/3 text-6xl ${
              settings.reduceMotion ? "" : "animate-bounce"
            }`}
            style={{ animationDelay: "0.5s" }}
          >
            =
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-0">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 pt-32 pb-20 sm:pt-40 sm:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 drop-shadow-lg">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                MathMania
              </span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 drop-shadow-md">
              Where Math Meets Fun! 🎉
            </p>
            <p className="text-lg sm:text-xl text-white/80 mb-12 max-w-2xl mx-auto drop-shadow">
              Transform math learning into an exciting adventure with
              interactive lessons, live tutoring, and gamified challenges
              designed for elementary school children.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl"
                asChild
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section className="py-20 sm:py-32 px-4 bg-white/90 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-4 text-gray-900">
              Our Mission
            </h2>
            <p className="text-xl sm:text-2xl text-center text-gray-700 mb-16 max-w-3xl mx-auto">
              To make math learning enjoyable, accessible, and effective for
              every child
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 sm:p-8 text-center border-2 hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  Build Confidence
                </h3>
                <p className="text-gray-600">
                  Help children develop strong math foundations and build
                  confidence through positive reinforcement and achievements.
                </p>
              </Card>
              <Card className="p-6 sm:p-8 text-center border-2 hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  Make Learning Fun
                </h3>
                <p className="text-muted-foreground">
                  Transform traditional math education into an engaging,
                  interactive experience that kids actually enjoy.
                </p>
              </Card>
              <Card className="p-6 sm:p-8 text-center border-2 hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">💪</div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  Support Parents
                </h3>
                <p className="text-muted-foreground">
                  Provide parents with tools to monitor progress and support
                  their child's learning journey effectively.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32 px-4 bg-gradient-to-b from-white to-blue-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-4 text-gray-900">
              Amazing Features
            </h2>
            <p className="text-xl sm:text-2xl text-center text-gray-700 mb-16 max-w-3xl mx-auto">
              Everything your child needs to excel in math
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 sm:p-8 border-2 hover:shadow-xl transition-all hover:scale-105"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 px-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl sm:text-2xl mb-12 text-white/90">
              Join thousands of children already having fun with math!
            </p>
            <Button
              size="lg"
              className="text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl"
              asChild
            >
              <Link href="/sign-up">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    // Wait for both auth and profile to finish loading
    if (authLoading || profileLoading) return;

    // If user is authenticated, redirect based on their type
    if (user) {
      const userType = profile?.type;

      // Determine redirect path
      let redirectPath = "";
      if (userType === "child" || !userType) {
        redirectPath = "/child";
      } else if (userType === "parent") {
        redirectPath = "/parent";
      } else if (userType === "admin") {
        redirectPath = "/admin";
      }

      // Only redirect if we have a path and we're not already there
      if (redirectPath && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== redirectPath) {
          router.replace(redirectPath);
        }
      }
    }
  }, [user, profile, authLoading, profileLoading, router]);

  // Show loading state while checking auth and profile
  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting (prevents flash of landing page)
  if (user && profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
