"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";
import { db } from "@/lib/firebase";
import {
  calculateStreak,
  parseDuration,
  getTodayISOString,
} from "@/lib/user-stats";
import ReactMarkdown from "react-markdown";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const resourceId = params.id;

  const [resource, setResource] = useState<any>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const loadLesson = async () => {
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
          title: data.title ?? "Untitled Lesson",
          xp: typeof data.xp === "number" ? data.xp : 0,
          duration: data.duration ?? "15 min",
        });
        setContent(data.content ?? "No content available.");
      } catch (err) {
        console.error("Error loading lesson:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [resourceId]);

  useEffect(() => {
    if (!user) return;
    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return;
        const data = snapshot.data() as { completedResources?: string[] };
        if (Array.isArray(data.completedResources)) {
          setIsCompleted(data.completedResources.includes(resourceId));
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };
    loadUserProfile();
  }, [user, resourceId]);

  const handleMarkComplete = async () => {
    if (!user || !resource) return;

    setIsCompleting(true);
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

        setIsCompleted(true);
      });
    } catch (err) {
      console.error("Error marking complete:", err);
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-lg text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-lg">Lesson not found.</p>
        <Button className="mt-4" onClick={() => router.push("/resources")}>
          Back to resources
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
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

        <CardContent className="p-0">
          <div className="markdown-content prose prose-sm sm:prose-base md:prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }: { children?: React.ReactNode }) => (
                  <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>
                ),
                h2: ({ children }: { children?: React.ReactNode }) => (
                  <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>
                ),
                h3: ({ children }: { children?: React.ReactNode }) => (
                  <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
                ),
                p: ({ children }: { children?: React.ReactNode }) => (
                  <p className="mb-4 leading-relaxed text-base">{children}</p>
                ),
                ul: ({ children }: { children?: React.ReactNode }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }: { children?: React.ReactNode }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                    {children}
                  </ol>
                ),
                li: ({ children }: { children?: React.ReactNode }) => (
                  <li className="ml-2">{children}</li>
                ),
                code: ({
                  children,
                  className,
                }: {
                  children?: React.ReactNode;
                  className?: string;
                }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }: { children?: React.ReactNode }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }: { children?: React.ReactNode }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }: { children?: React.ReactNode }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }: { children?: React.ReactNode }) => (
                  <em className="italic">{children}</em>
                ),
                a: ({
                  href,
                  children,
                }: {
                  href?: string;
                  children?: React.ReactNode;
                }) => (
                  <a
                    href={href}
                    className="text-primary underline hover:text-primary/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </CardContent>

        {!isCompleted && (
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

        {isCompleted && (
          <div className="pt-4 sm:pt-5 md:pt-6 border-t">
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
              <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-semibold">
                ✓ Lesson completed! You earned {resource.xp} XP.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
