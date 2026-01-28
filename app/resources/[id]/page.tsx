"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { ExternalLink, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Resource } from "@/lib/resources";
import { useAuth } from "@/contexts/auth-provider";
import { db } from "@/lib/firebase";
import {
  calculateStreak,
  parseDuration,
  getTodayISOString,
} from "@/lib/user-stats";

export default function ResourceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentXp, setCurrentXp] = useState<number | null>(null);

  const resourceId = params.id;

  useEffect(() => {
    const loadResource = async () => {
      try {
        const ref = doc(collection(db, "resources"), resourceId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setResource(null);
          return;
        }
        const data = snap.data() as any;
        setResource({
          id: snap.id,
          title: data.title ?? "Untitled resource",
          type: data.type ?? "lesson",
          difficulty: data.difficulty ?? "Easy",
          duration: data.duration ?? "N/A",
          xp: typeof data.xp === "number" ? data.xp : 0,
          locked: Boolean(data.locked),
          icon: data.icon ?? "📚",
          description: data.description ?? "",
          url: data.url,
          unlockLevel: data.unlockLevel,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load resource.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [resourceId]);

  useEffect(() => {
    if (!user) return;

    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data() as {
          xp?: string;
          completedResources?: string[];
        };
        const xp = parseInt(data.xp ?? "0", 10) || 0;
        setCurrentXp(xp);
        if (Array.isArray(data.completedResources)) {
          setIsCompleted(data.completedResources.includes(resourceId));
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    loadUserProfile();
  }, [user, resourceId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-lg text-muted-foreground">Loading resource...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-lg">Resource not found.</p>
        <Button className="mt-4" onClick={() => router.push("/resources")}>
          Back to resources
        </Button>
      </div>
    );
  }

  // Convert video URL to embed URL
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube URLs
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo URLs
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // If it's already an embed URL, return as is
    if (url.includes("youtube.com/embed") || url.includes("player.vimeo.com")) {
      return url;
    }

    // Return null if we can't convert it
    return null;
  };

  const embedUrl =
    resource.type === "video" && resource.url
      ? getEmbedUrl(resource.url)
      : null;

  const handleMarkComplete = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsCompleting(true);
    setError(null);

    const userRef = doc(db, "users", user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists()) {
          throw new Error("User profile not found.");
        }

        const data = snapshot.data() as {
          xp?: string;
          completedResources?: string[];
          currentStreak?: number;
          totalTime?: number;
          lastActivityDate?: string;
        };

        const completedResources = Array.isArray(data.completedResources)
          ? data.completedResources
          : [];

        if (completedResources.includes(resourceId)) {
          // Already completed; don't award XP again.
          return;
        }

        const currentXpValue = parseInt(data.xp ?? "0", 10) || 0;
        const newXp = currentXpValue + (resource.xp || 0);

        // Calculate new streak
        const currentStreak = data.currentStreak || 0;
        const newStreak = calculateStreak(data.lastActivityDate, currentStreak);

        // Add time spent (parse duration from resource)
        const timeSpent = parseDuration(resource.duration || "15 min");
        const currentTotalTime = data.totalTime || 0;
        const newTotalTime = currentTotalTime + timeSpent;

        // Update today's date
        const todayISO = getTodayISOString();

        transaction.update(userRef, {
          xp: String(newXp),
          completedResources: [...completedResources, resourceId],
          currentStreak: newStreak,
          totalTime: newTotalTime,
          lastActivityDate: todayISO,
        });

        setCurrentXp(newXp);
        setIsCompleted(true);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to mark as complete.";
      setError(message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-3 sm:mb-4 text-sm sm:text-base"
        size="sm"
        onClick={() => router.push("/resources")}
      >
        ← Back to resources
      </Button>

      <Card className="p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words">
            {resource.title}
          </h1>
        </div>

        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          {resource.description}
        </p>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge className="text-xs sm:text-sm">{resource.type}</Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {resource.difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {resource.duration}
          </Badge>
          {resource.xp > 0 && (
            <Badge className="bg-accent hover:bg-accent text-xs sm:text-sm">
              +{resource.xp} XP
            </Badge>
          )}
        </div>

        {typeof currentXp === "number" && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your current XP: <span className="font-semibold">{currentXp}</span>
          </p>
        )}

        {/* Video Embed */}
        {resource.type === "video" && embedUrl && (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={resource.title}
            />
          </div>
        )}

        {/* Download or external link for non-video resources */}
        {resource.type === "download" && resource.url && (
          <Button
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base md:text-lg gap-2"
            variant="outline"
            onClick={() =>
              window.open(resource.url, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
            Download Resource
          </Button>
        )}

        {/* Video fallback if embed URL couldn't be generated */}
        {resource.type === "video" && resource.url && !embedUrl && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unable to embed this video. Opening in a new tab instead.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base md:text-lg gap-2"
              variant="outline"
              onClick={() =>
                window.open(resource.url, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
              Open Video
            </Button>
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          {resource.type === "quiz" || resource.type === "lesson" ? (
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base md:text-lg gap-2"
              onClick={() => {
                if (resource.type === "quiz") {
                  router.push(`/resources/${resourceId}/quiz`);
                } else if (resource.type === "lesson") {
                  router.push(`/resources/${resourceId}/lesson`);
                }
              }}
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              {resource.type === "quiz" ? "Start Quiz" : "Read Lesson"}
            </Button>
          ) : null}

          {error && (
            <p className="text-xs sm:text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Mark as Complete for video resources */}
        {resource.type === "video" && !isCompleted && (
          <div className="pt-4 sm:pt-5 md:pt-6 border-t">
            <Button
              size="lg"
              className="w-full text-sm sm:text-base md:text-lg"
              onClick={handleMarkComplete}
              disabled={isCompleting}
            >
              {isCompleting
                ? "Saving..."
                : `Mark as Complete (+${resource.xp} XP)`}
            </Button>
          </div>
        )}

        {resource.type === "video" && isCompleted && (
          <div className="pt-4 sm:pt-5 md:pt-6 border-t">
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
              <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-semibold">
                ✓ Video completed! You earned {resource.xp} XP.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
