"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { UserProfile } from "@/types/user";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export type UserType = "parent" | "child" | "admin";

export default function SignUpPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [userType, setUserType] = useState<UserType>(
		"child"
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [showGoogleUserTypeDialog, setShowGoogleUserTypeDialog] =
		useState(false);
	const [googleUserType, setGoogleUserType] = useState<
		UserType
	>("child");
	const [googleName, setGoogleName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const saveUserData = async (
		userId: string,
		userEmail: string,
		type: UserType,
		displayName: string
	) => {
		try {
			const userData: Omit<UserProfile, "uid"> = {
				email: userEmail,
				displayName: displayName,
				type,
				level: 1,
				xp: 0,
				character: "fox",
				color: "bg-gradient-to-br from-blue-400 to-cyan-400",
				currentStreak: 0,
				totalTime: 0,
				lastActivityDate: new Date().toISOString(),
				completedResources: [],
				achievements: [],
				children: [],
				settings: {
					colorMode: "light",
					highContrast: false,
					fontSize: "medium",
					reduceMotion: false,
					increasedSpacing: false,
					screenReaderOptimized: false,
					focusIndicators: true,
					underlineLinks: false,
				},
				registeredSessions: [],
			};

			await setDoc(doc(db, "users", userId), userData);
		} catch (err) {
			console.error("Error saving user data:", err);
			throw err;
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const firstNameInput = (
			event.currentTarget.elements.namedItem("firstName") as HTMLInputElement
		).value;
		const lastNameInput = (
			event.currentTarget.elements.namedItem("lastName") as HTMLInputElement
		).value;

		if (!firstNameInput.trim() || !lastNameInput.trim()) {
			setError("Please enter your first and last name.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			await saveUserData(
				userCredential.user.uid,
				email,
				userType,
				`${firstNameInput.trim()} ${lastNameInput.trim()}`
			);
			router.replace("/");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to create your account. Please try again.";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignUp = async () => {
		setIsGoogleLoading(true);
		setError(null);

		try {
			const result = await signInWithPopup(auth, googleProvider);
			const user = result.user;

			// Check if user already exists in Firestore
			const userDoc = await getDoc(doc(db, "users", user.uid));

			if (!userDoc.exists()) {
				// New user - extract name from Google profile if available
				setGoogleName(user.displayName || "");
				// Show dialog to select user type and confirm name
				setShowGoogleUserTypeDialog(true);
			} else {
				// Existing user - redirect
				router.replace("/");
			}
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to sign up with Google. Please try again.";
			setError(message);
		} finally {
			setIsGoogleLoading(false);
		}
	};

	const handleGoogleUserTypeSubmit = async () => {
		if (!auth.currentUser) return;

		if (!googleName.trim()) {
			setError("Please enter your full name.");
			return;
		}

		setIsGoogleLoading(true);
		setError(null);

		try {
			await saveUserData(
				auth.currentUser.uid,
				auth.currentUser.email || "",
				googleUserType,
				googleName.trim()
			);
			setShowGoogleUserTypeDialog(false);
			router.replace("/");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to save user data. Please try again.";
			setError(message);
		} finally {
			setIsGoogleLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-screen items-center justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-12">
			<Card>
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-2xl sm:text-3xl font-bold text-center">
						Create an account
					</CardTitle>
					<CardDescription className="text-center text-sm sm:text-base mt-2">
						Join MathMania and unlock playful math adventures.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 sm:p-6">

					<form onSubmit={handleSubmit} className="flex flex-row gap-10">

						<div className="space-y-4 sm:space-y-6 min-w-60">

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									autoComplete="email"
									placeholder="you@example.com"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									autoComplete="new-password"
									placeholder="Create a secure password"
									minLength={6}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									autoComplete="new-password"
									placeholder="Repeat your password"
									minLength={6}
									required
								/>
							</div>

						</div>

						<div className="space-y-4 sm:space-y-6 min-w-60">

							<div className="space-y-3">
								<Label>I am a...</Label>
								<RadioGroup
									value={userType}
									onValueChange={(value) => setUserType(value as UserType)}
									className="space-y-3"
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="parent" id="parent" />
										<Label
											htmlFor="parent"
											className="font-normal cursor-pointer flex-1"
										>
											Parent
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="child" id="child" />
										<Label
											htmlFor="child"
											className="font-normal cursor-pointer flex-1"
										>
											Child
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="admin" id="admin" />
										<Label
											htmlFor="admin"
											className="font-normal cursor-pointer flex-1"
										>
											Admin
										</Label>
									</div>
								</RadioGroup>
							</div>

						</div>


					</form>

					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Button
						type="submit"
						className="w-full text-sm sm:text-base mt-6"
						size="lg"
						disabled={isSubmitting || isGoogleLoading}
					>
						{isSubmitting ? "Creating account..." : "Create account"}
					</Button>

					<div className="relative my-2 sm:my-4">
						<div className="absolute inset-0 flex items-center">
							<Separator />
						</div>
						<div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								Or
							</span>
						</div>
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full text-sm sm:text-base"
						size="lg"
						onClick={handleGoogleSignUp}
						disabled={isSubmitting || isGoogleLoading}
					>
						{isGoogleLoading ? (
							"Signing up..."
						) : (
							<>
								<FontAwesomeIcon icon={faGoogle}/>
								<span className="hidden sm:inline">Sign up with Google</span>
								<span className="sm:hidden">Google</span>
							</>
						)}
					</Button>

					<p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link
							href="/sign-in"
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>

			<Dialog
				open={showGoogleUserTypeDialog}
				onOpenChange={setShowGoogleUserTypeDialog}
			>
				<DialogContent className="w-[95vw] max-w-md mx-4">
					<DialogHeader>
						<DialogTitle className="text-lg sm:text-xl">
							Complete Your Profile
						</DialogTitle>
						<DialogDescription className="text-sm">
							Please provide your name and choose the type of account you're
							creating.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
						<div className="space-y-2">
							<Label htmlFor="googleName">Full Name</Label>
							<Input
								id="googleName"
								type="text"
								value={googleName}
								onChange={(event) => setGoogleName(event.target.value)}
								autoComplete="name"
								placeholder="John Cena"
								required
							/>
						</div>

						<div className="space-y-3">
							<Label>I am a...</Label>
							<RadioGroup
								value={googleUserType}
								onValueChange={(value) => setGoogleUserType(value as UserType)}
								className="space-y-3"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="parent" id="google-parent" />
									<Label
										htmlFor="google-parent"
										className="font-normal cursor-pointer flex-1"
									>
										Parent
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="child" id="google-child" />
									<Label
										htmlFor="google-child"
										className="font-normal cursor-pointer flex-1"
									>
										Child
									</Label>
								</div>
								<div className="flex items-center space-x-2">
									<RadioGroupItem value="admin" id="google-admin" />
									<Label
										htmlFor="google-admin"
										className="font-normal cursor-pointer flex-1"
									>
										Admin
									</Label>
								</div>
							</RadioGroup>
						</div>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
					</div>
					<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
						<Button
							variant="outline"
							onClick={() => setShowGoogleUserTypeDialog(false)}
							disabled={isGoogleLoading}
							className="w-full sm:w-auto text-sm sm:text-base"
						>
							Cancel
						</Button>
						<Button
							onClick={handleGoogleUserTypeSubmit}
							disabled={isGoogleLoading}
							className="w-full sm:w-auto text-sm sm:text-base"
						>
							{isGoogleLoading ? "Saving..." : "Continue"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
