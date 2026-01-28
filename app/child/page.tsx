"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Clock, Star, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";

type UpcomingSession = {
  id: string;
  title: string;
  day: string;
  time: string;
  type: "tutoring" | "group";
  tutor: string;
  nextDate: Date;
};

export default function ChildPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [allResources, setAllResources] = useState<any[]>([]);
  const [completedResourceIds, setCompletedResourceIds] = useState<string[]>(
    []
  );
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Calculate character data from profile
  const totalXP = profile ? parseInt(String(profile.xp || "0"), 10) : 0;
  const level = Math.floor(totalXP / 250) + 1; // 250 XP per level
  const xpInCurrentLevel = totalXP % 250;
  const xpToNextLevel = 250;
  const characterName = profile?.displayName
    ? `${profile.displayName.split(" ")[0]}'s Math Buddy`
    : "Math Buddy";
  const characterColor =
    profile?.color || "bg-gradient-to-br from-blue-600 to-blue-300";
  const characterIcon = profile?.character || "🦊";

  const character = {
    level,
    xp: xpInCurrentLevel,
    xpToNextLevel,
    name: characterName,
    color: characterColor,
    icon: characterIcon,
  };

  // Get day of week index (0 = Sunday, 1 = Monday, etc.)
  const getDayIndex = (dayName: string): number => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days.indexOf(dayName);
  };

  // Calculate next occurrence of a day
  const getNextDateForDay = (dayName: string, startTime: string): Date => {
    const today = new Date();
    const dayIndex = getDayIndex(dayName);
    const currentDay = today.getDay();

    let daysUntil = dayIndex - currentDay;
    if (daysUntil < 0) {
      daysUntil += 7; // Next week
    } else if (daysUntil === 0) {
      // Same day - check if time has passed
      if (startTime) {
        const [hours, minutes] = startTime
          .replace(/[APM]/gi, "")
          .split(":")
          .map(Number);
        const isPM = startTime.toUpperCase().includes("PM");
        const sessionHour =
          isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours;
        const sessionTime = new Date(today);
        sessionTime.setHours(sessionHour, minutes || 0, 0, 0);
        if (sessionTime < today) {
          daysUntil = 7; // Next week
        }
      }
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate;
  };

  const formatSessionTime = (date: Date, time: string): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${time.split(" - ")[0]}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${time.split(" - ")[0]}`;
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Fetch resources
  useEffect(() => {
    const resourcesRef = collection(db, "resources");

    const unsubscribe = onSnapshot(
      resourcesRef,
      (snapshot) => {
        const resources: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          resources.push({
            id: docSnap.id,
            title: data.title || "Untitled",
            type: data.type || "lesson",
            difficulty: data.difficulty || "Easy",
            xp: typeof data.xp === "number" ? data.xp : 0,
            icon: data.icon || "📚",
            locked: Boolean(data.locked),
          });
        });
        setAllResources(resources);
      },
      (error) => {
        console.error("Error loading resources:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch user profile for completed resources
  useEffect(() => {
    if (!user || !profile) {
      setCompletedResourceIds([]);
      setLoading(false);
      return;
    }

    const completedResources = (profile as any).completedResources || [];
    setCompletedResourceIds(completedResources);
    setLoading(false);
  }, [user, profile]);

  // Fetch upcoming sessions
  useEffect(() => {
    if (!user) {
      setUpcomingSessions([]);
      return;
    }

    const userPath = `/users/${user.uid}`;
    const sessionsRef = collection(db, "sessions");

    const unsubscribe = onSnapshot(
      sessionsRef,
      (snapshot) => {
        const sessions: UpcomingSession[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const students = Array.isArray(data.students)
            ? (data.students as string[])
            : [];

          if (students.includes(userPath)) {
            const day = data.date || "Monday";
            const startTime = data.startTime || "";
            const nextDate = getNextDateForDay(day, startTime);

            sessions.push({
              id: docSnap.id,
              title: data.name || "Untitled Session",
              day,
              time:
                data.startTime && data.endTime
                  ? `${data.startTime} - ${data.endTime}`
                  : startTime,
              type:
                typeof data.type === "string" &&
                data.type.toLowerCase() === "group"
                  ? "group"
                  : "tutoring",
              tutor: data.teacher || "",
              nextDate,
            });
          }
        });

        sessions.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
        setUpcomingSessions(sessions);
      },
      (error) => {
        console.error("Error loading sessions:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate activities
  const inProgressResources = allResources.filter(
    (resource) =>
      !completedResourceIds.includes(resource.id) &&
      !resource.locked &&
      (resource.type === "lesson" || resource.type === "quiz")
  );

  const activities = {
    inProgress: inProgressResources.slice(0, 2).map((resource) => ({
      id: resource.id,
      title: resource.title,
      progress: 0, // Can't track partial progress without additional data
      type: resource.type,
      icon: resource.icon,
    })),
    scheduled: upcomingSessions.slice(0, 5).map((session) => ({
      id: session.id,
      title: session.title,
      time: formatSessionTime(session.nextDate, session.time),
      type: session.type,
      icon: session.type === "group" ? "👥" : "👨‍🏫",
    })),
    recommended: allResources
      .filter(
        (resource) =>
          !completedResourceIds.includes(resource.id) &&
          !resource.locked &&
          resource.difficulty === "Easy"
      )
      .slice(0, 3)
      .map((resource) => ({
        id: resource.id,
        title: resource.title,
        difficulty: resource.difficulty,
        xpReward: resource.xp,
        type: resource.type,
        icon: resource.icon,
      })),
  };

  if (loading || profileLoading) {
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

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      {/* Character Display Section */}
      <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-12">
        {/* Character Avatar */}
        <div className="relative mb-4 sm:mb-6">
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full ${character.color} flex items-center justify-center shadow-2xl border-4 sm:border-6 md:border-8 border-white dark:border-gray-800`}
          >
            <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
              {character.icon}
            </span>
          </div>
          {/* Level Badge */}
          <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-base sm:text-lg md:text-xl lg:text-2xl px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-accent hover:bg-accent">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1" />
            Level {character.level}
          </Badge>
        </div>

        {/* Character Info */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 sm:mb-4 text-balance px-2">
          {character.name}
        </h1>

        {/* XP Progress Bar */}
        <div className="w-full max-w-md px-4 sm:px-0">
          <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
            <span className="font-medium text-muted-foreground">
              Progress to Level {character.level + 1}
            </span>
            <span className="font-bold text-primary">
              {character.xp} / {character.xpToNextLevel} XP
            </span>
          </div>
          <div className="h-3 sm:h-4 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{
                width: `${(character.xp / character.xpToNextLevel) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Customize Button */}
        <Button
          size="lg"
          className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-5 md:py-6 gap-2"
          asChild
        >
          <Link href="/character">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            <span className="hidden sm:inline">Customize Character</span>
            <span className="sm:hidden">Customize</span>
          </Link>
        </Button>
      </div>

      {/* Activities Section */}
      <div className="space-y-6 sm:space-y-8">
        {/* In Progress */}
        {activities.inProgress.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Keep Going!
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {activities.inProgress.map((activity) => (
                <Card
                  key={activity.id}
                  className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="text-4xl sm:text-5xl">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 break-words">
                        {activity.title}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-bold text-primary">
                            {activity.progress}%
                          </span>
                        </div>
                        <div className="h-2 sm:h-3 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="w-full mt-3 sm:mt-4 text-sm sm:text-base md:text-lg"
                        onClick={() =>
                          router.push(
                            `/resources/${activity.id}${
                              activity.type === "quiz"
                                ? "/quiz"
                                : activity.type === "lesson"
                                ? "/lesson"
                                : ""
                            }`
                          )
                        }
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Scheduled */}
        {activities.scheduled.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Coming Up
              </h2>
            </div>
            <div className="grid gap-3 sm:gap-4">
              {activities.scheduled.map((activity) => (
                <Card
                  key={activity.id}
                  className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow cursor-pointer bg-accent/10"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-4xl sm:text-5xl">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 break-words">
                        {activity.title}
                      </h3>
                      <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6"
                      onClick={() => router.push("/schedule")}
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recommended */}
        <section>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Try These!
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activities.recommended.map((activity) => (
              <Card
                key={activity.id}
                className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">
                    {activity.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-balance">
                    {activity.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1"
                    >
                      {activity.difficulty}
                    </Badge>
                    <Badge className="text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1 bg-accent hover:bg-accent">
                      +{activity.xpReward} XP
                    </Badge>
                  </div>
                  <Button
                    size="lg"
                    className="w-full text-sm sm:text-base md:text-lg"
                    onClick={() =>
                      router.push(
                        `/resources/${activity.id}${
                          activity.type === "quiz"
                            ? "/quiz"
                            : activity.type === "lesson"
                            ? "/lesson"
                            : ""
                        }`
                      )
                    }
                  >
                    Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
