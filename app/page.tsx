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
import Image from "next/image";

type UpcomingSession = {
	id: string;
	title: string;
	day: string;
	time: string;
	type: "tutoring" | "group";
	tutor: string;
	nextDate: Date;
};

function ProductDemo() {

	return (

		<div className="mt-16 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
			<div className="flex items-center gap-2 px-4 py-3 bg-black/60 border-b border-white/10 backdrop-blur-sm">
				<span className="size-3 rounded-full bg-red-400" />
				<span className="size-3 rounded-full bg-yellow-400" />
				<span className="size-3 rounded-full bg-green-400" />
				<div className="mx-auto w-64 h-6 rounded-md bg-white/10 text-white/50 text-xs flex items-center justify-center">
					mathmania.shaurya.pro
				</div>
			</div>
			{/* Demo screenshot */}
			<Image src="/landing-demo.png" alt="MathMania product demo" width={1280} height={720} className="w-full" />
		</div>
	)

}

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
					className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-800"
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
						className={`absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl ${settings.reduceMotion ? "" : "animate-pulse"
							}`}
					/>
					<div
						className={`absolute top-40 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl ${settings.reduceMotion ? "" : "animate-pulse"
							}`}
						style={{ animationDelay: "1s" }}
					/>
					<div
						className={`absolute bottom-20 left-1/3 w-80 h-80 bg-pink-300 rounded-full blur-3xl ${settings.reduceMotion ? "" : "animate-pulse"
							}`}
						style={{ animationDelay: "2s" }}
					/>
				</div>

			</div>

			{/* Content */}
			<div className="relative z-0">
				{/* Hero Section */}
				<section className="min-h-screen flex items-center justify-center px-4 pt-32 pb-20 sm:pt-40 sm:pb-32">
					<div className="max-w-4xl mx-auto text-center relative z-0">
						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
							Welcome to{" "}
							<span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
								MathMania
							</span>
						</h1>
						<p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto drop-shadow">
							Transform math learning into an exciting adventure with
							interactive lessons, live tutoring, and gamified challenges
							designed for elementary school children.
						</p>
						<div className="flex flex-row gap-4 justify-center">
							<Button
								size="lg"
								asChild
								variant="secondary"
							>
								<Link href="/sign-up">Get Started</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								asChild
								className="text-white"
							>
								<Link href="/sign-up">Learn More</Link>
							</Button>
						</div>
						<ProductDemo />
					</div>
				</section>

				{/* Goals Section */}
				<section className="py-20 sm:py-32 px-4 bg-white/90 backdrop-blur-sm">
					<div className="max-w-6xl mx-auto">
						<h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-4 text-gray-900">
							Our Mission
						</h2>
						<p className="text-xl sm:text-2xl text-center text-gray-700 mb-16 max-w-3xl mx-auto">
							To make math learning enjoyable, accessible, and effective for every child
						</p>
						<div className="grid md:grid-cols-3 gap-6 lg:gap-10 items-center">
							{[
								{ icon: Trophy, title: "Build Confidence", description: "Help children develop strong math foundations and build confidence through positive reinforcement and achievements.", wrapperClass: "lg:-rotate-3 lg:translate-y-6" },
								{ icon: Zap, title: "Make Learning Fun", description: "Transform traditional math education into an engaging, interactive experience that kids actually enjoy.", wrapperClass: "lg:-translate-y-4" },
								{ icon: Users, title: "Support Parents", description: "Provide parents with tools to monitor progress and support their child's learning journey effectively.", wrapperClass: "lg:rotate-3 lg:translate-y-6" },
							].map(({ icon: Icon, title, description, wrapperClass }) => (
								<div key={title} className={`transition-transform duration-300 hover:scale-105 ${wrapperClass}`}>
									<Card className={`border-2 hover:shadow-xl p-6 lg:p-10`}>
										<div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
											<Icon className="h-6 w-6 text-blue-600" />
										</div>
										<h3 className="text-xl lg:text-2xl font-black mb-3 text-gray-900">{title}</h3>
										<p className="text-gray-600 leading-relaxed text-md lg:text-lg">{description}</p>
									</Card>
								</div>
							))}
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
										<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-800 flex items-center justify-center mb-4">
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
				<section className="py-20 sm:py-32 px-4 bg-gradient-to-br from-blue-400 to-blue-800 text-white">
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
