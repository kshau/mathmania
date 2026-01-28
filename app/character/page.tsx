"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";

export default function CharacterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [selectedCharacter, setSelectedCharacter] = useState("🦊");
  const [selectedColor, setSelectedColor] = useState(
    "bg-gradient-to-br from-blue-400 to-cyan-400"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user's current character and color from Firestore
  useEffect(() => {
    if (profile) {
      if (profile.character) {
        setSelectedCharacter(profile.character);
      }
      if (profile.color) {
        setSelectedColor(profile.color);
      }
    }
  }, [profile]);

  // Calculate user level from XP
  const totalXP = profile
    ? parseInt(String(profile.xp || "0"), 10)
    : 0;
  const userLevel = Math.floor(totalXP / 250) + 1;

  const characters = [
    { emoji: "🦊", name: "Fox", unlocked: true },
    { emoji: "🐻", name: "Bear", unlocked: true },
    { emoji: "🐰", name: "Bunny", unlocked: true },
    { emoji: "🐼", name: "Panda", unlocked: true },
    { emoji: "🦁", name: "Lion", unlocked: userLevel >= 10, unlockLevel: 10 },
    { emoji: "🐯", name: "Tiger", unlocked: userLevel >= 15, unlockLevel: 15 },
    {
      emoji: "🦄",
      name: "Unicorn",
      unlocked: userLevel >= 20,
      unlockLevel: 20,
    },
    { emoji: "🐉", name: "Dragon", unlocked: userLevel >= 25, unlockLevel: 25 },
  ];

  const colors = [
    {
      name: "Purple Pink",
      class: "bg-gradient-to-br from-purple-400 to-pink-400",
    },
    { name: "Blue Cyan", class: "bg-gradient-to-br from-blue-400 to-cyan-400" },
    {
      name: "Green Lime",
      class: "bg-gradient-to-br from-green-400 to-lime-400",
    },
    {
      name: "Orange Red",
      class: "bg-gradient-to-br from-orange-400 to-red-400",
    },
    { name: "Pink Rose", class: "bg-gradient-to-br from-pink-400 to-rose-400" },
    {
      name: "Indigo Purple",
      class: "bg-gradient-to-br from-indigo-400 to-purple-400",
    },
  ];

  const handleSave = async () => {
    if (!user) {
      setError("You must be signed in to save your character.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const userRef = doc(db, "users", user.uid);

      // Check if user document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        setError("User profile not found. Please contact support.");
        setIsSaving(false);
        return;
      }

      // Update character and color in Firestore
      await updateDoc(userRef, {
        character: selectedCharacter,
        color: selectedColor,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save character. Please try again.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <Button
          size="sm"
          variant="outline"
          asChild
          className="h-8 sm:h-10 md:h-12"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
          Customize Your Character
        </h1>
      </div>

      {/* Preview */}
      <Card className="p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col items-center">
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full ${selectedColor} flex items-center justify-center shadow-2xl border-4 sm:border-6 md:border-8 border-white dark:border-gray-800 mb-3 sm:mb-4`}
          >
            <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
              {selectedCharacter}
            </span>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Your Math Buddy
          </p>
        </div>
      </Card>

      {/* Character Selection */}
      <section className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
          Choose Character
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {characters.map((char) => (
            <Card
              key={char.emoji}
              className={`p-3 sm:p-4 md:p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedCharacter === char.emoji
                  ? "ring-2 sm:ring-4 ring-primary"
                  : ""
              } ${!char.unlocked ? "opacity-50" : ""}`}
              onClick={() => char.unlocked && setSelectedCharacter(char.emoji)}
            >
              <div className="text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-1 sm:mb-2">
                  {char.emoji}
                </div>
                <p className="font-bold text-sm sm:text-base md:text-lg">
                  {char.name}
                </p>
                {!char.unlocked && (
                  <Badge
                    variant="secondary"
                    className="mt-1 sm:mt-2 text-xs sm:text-sm"
                  >
                    Level {char.unlockLevel}
                  </Badge>
                )}
                {selectedCharacter === char.emoji && (
                  <div className="mt-1 sm:mt-2 flex justify-center">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Color Selection */}
      <section className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
          Choose Color
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {colors.map((color) => (
            <Card
              key={color.name}
              className={`p-3 sm:p-4 md:p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedColor === color.class
                  ? "ring-2 sm:ring-4 ring-primary"
                  : ""
              }`}
              onClick={() => setSelectedColor(color.class)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full ${color.class} border-2 sm:border-3 md:border-4 border-white dark:border-gray-800 shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base md:text-lg">
                    {color.name}
                  </p>
                  {selectedColor === color.class && (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {error && (
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertDescription className="text-sm sm:text-base">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="max-w-md w-full">
            <AlertDescription className="text-sm sm:text-base">
              Character saved successfully!
            </AlertDescription>
          </Alert>
        )}
        <Button
          size="lg"
          className="w-full sm:w-auto text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6"
          onClick={handleSave}
          disabled={isSaving || !user}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
