"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Video,
  ChevronRight,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";

type UpcomingSession = {
  id: string;
  title: string;
  date: string;
  day: string;
  time: string;
  type: "tutoring" | "group";
  tutor: string;
  nextDate: Date;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(
    []
  );
  const [completedResources, setCompletedResources] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [skillProgress, setSkillProgress] = useState<
    { skill: string; progress: number; color: string }[]
  >([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const loading = profileLoading || resourcesLoading;

  // Calculate stats from profile and completed resources
  const totalXP = profile ? parseInt(profile.xp || "0", 10) : 0;
  const level = Math.floor(totalXP / 250) + 1; // 250 XP per level
  const activitiesCompleted = completedResources.length;
  const currentStreak = profile ? profile.currentStreak || 0 : 0;
  const totalTimeMinutes = profile ? profile.totalTime || 0 : 0; // in minutes
  const totalTimeHours = Math.floor(totalTimeMinutes / 60);
  const totalTimeRemainingMinutes = totalTimeMinutes % 60;

  const stats = {
    totalXP,
    level,
    activitiesCompleted,
    currentStreak,
    totalTime: totalTimeMinutes,
    totalTimeFormatted:
      totalTimeHours > 0
        ? `${totalTimeHours}h ${totalTimeRemainingMinutes}m`
        : `${totalTimeRemainingMinutes}m`,
  };

  // Calculate achievements
  const achievements = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first activity",
      unlocked: activitiesCompleted > 0,
      icon: "🎯",
    },
    {
      id: 2,
      title: "Quick Learner",
      description: "Reach Level 5",
      unlocked: level >= 5,
      icon: "⚡",
    },
    {
      id: 3,
      title: "Week Warrior",
      description: "7 day streak",
      unlocked: currentStreak >= 7,
      icon: "🔥",
    },
    {
      id: 4,
      title: "Math Master",
      description: "Complete 50 activities",
      unlocked: activitiesCompleted >= 50,
      icon: "👑",
    },
    {
      id: 5,
      title: "Perfect Score",
      description: "Get 100% on 10 quizzes",
      unlocked: false, // TODO: Track quiz scores
      icon: "💯",
    },
    {
      id: 6,
      title: "Level 10",
      description: "Reach Level 10",
      unlocked: level >= 10,
      icon: "⭐",
    },
  ];

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

  // Fetch completed resources and calculate stats
  useEffect(() => {
    if (!user || profileLoading) {
      setResourcesLoading(false);
      return;
    }

    if (!profile) {
      setCompletedResources([]);
      setRecentActivities([]);
      setSkillProgress([]);
      setResourcesLoading(false);
      return;
    }

    const loadCompletedResources = async () => {
      try {
        const completedResourceIds = (profile as any).completedResources || [];

        if (completedResourceIds.length === 0) {
          setCompletedResources([]);
          setRecentActivities([]);
          setSkillProgress([]);
          setResourcesLoading(false);
          return;
        }

        // Fetch all resources to get details
        const resourcesRef = collection(db, "resources");
        const resourcesSnapshot = await getDocs(resourcesRef);
        const allResources: any[] = [];

        resourcesSnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          allResources.push({
            id: docSnap.id,
            title: data.title || "Untitled",
            type: data.type || "lesson",
            difficulty: data.difficulty || "Easy",
            xp: typeof data.xp === "number" ? data.xp : 0,
            icon: data.icon || "📚",
          });
        });

        // Filter completed resources
        const completed = allResources.filter((r) =>
          completedResourceIds.includes(r.id)
        );

        setCompletedResources(completed);

        // Get recent activities (last 4 completed, in reverse order)
        const recent = completed
          .slice(-4)
          .reverse()
          .map((resource, index) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type,
            completed: true,
            xp: resource.xp,
            date:
              index === 0
                ? "Today"
                : index === 1
                ? "Yesterday"
                : `${index} days ago`,
            score: 100, // TODO: Track actual scores
          }));
        setRecentActivities(recent);

        // Calculate skill progress based on resource types
        const skills: { [key: string]: { total: number; completed: number } } =
          {};
        completed.forEach((resource) => {
          const skillName = resource.title.split(" ")[0]; // Use first word as skill
          if (!skills[skillName]) {
            skills[skillName] = { total: 0, completed: 0 };
          }
          skills[skillName].completed++;
        });

        allResources.forEach((resource) => {
          const skillName = resource.title.split(" ")[0];
          if (!skills[skillName]) {
            skills[skillName] = { total: 0, completed: 0 };
          }
          skills[skillName].total++;
        });

        const progress = Object.entries(skills)
          .map(([skill, data]) => ({
            skill,
            progress: Math.round((data.completed / data.total) * 100) || 0,
            color:
              skill === "Addition"
                ? "bg-purple-500"
                : skill === "Subtraction"
                ? "bg-pink-500"
                : skill === "Multiplication"
                ? "bg-blue-500"
                : skill === "Division"
                ? "bg-green-500"
                : "bg-gray-500",
          }))
          .slice(0, 4); // Show top 4 skills

        setSkillProgress(progress);
      } catch (error) {
        console.error("Error loading completed resources:", error);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadCompletedResources();
  }, [user, profile, profileLoading]);

  // Fetch upcoming sessions
  useEffect(() => {
    if (!user) {
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

          // Check if user is enrolled in this session
          if (students.includes(userPath)) {
            const day = data.date || "Monday";
            const startTime = data.startTime || "";
            const nextDate = getNextDateForDay(day, startTime);

            sessions.push({
              id: docSnap.id,
              title: data.name || "Untitled Session",
              date: day,
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

        // Sort by next date
        sessions.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
        setUpcomingSessions(sessions);
      },
      (error) => {
        console.error("Error loading sessions:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
          Your Progress
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2 sm:mb-3">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              {stats.totalXP}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Total XP
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2 sm:mb-3">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-accent" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
              {stats.level}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Level
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2 sm:mb-3">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">
              {stats.activitiesCompleted}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Completed
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-2 sm:mb-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-500">
              {stats.currentStreak}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Day Streak
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 sm:mb-3">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">
              {stats.totalTimeFormatted}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Time Spent
            </p>
          </div>
        </Card>
      </div>

      {/* Skills Progress */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
          Skills Progress
        </h2>
        <Card className="p-4 sm:p-5 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {skillProgress.map((skill) => (
              <div key={skill.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base sm:text-lg md:text-xl font-bold">
                    {skill.skill}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                    {skill.progress}%
                  </span>
                </div>
                <Progress
                  value={skill.progress}
                  className="h-2 sm:h-3 md:h-4"
                />
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Upcoming Sessions */}
      {user && (
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
              Upcoming Sessions
            </h2>
            <Button
              variant="outline"
              onClick={() => router.push("/schedule")}
              className="gap-2 text-sm sm:text-base"
              size="sm"
            >
              View All
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          {loading ? (
            <Card className="p-4 sm:p-5 md:p-6">
              <p className="text-sm sm:text-base text-muted-foreground">
                Loading sessions...
              </p>
            </Card>
          ) : upcomingSessions.length === 0 ? (
            <Card className="p-4 sm:p-5 md:p-6">
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">
                  No upcoming sessions
                </p>
                <Button
                  onClick={() => router.push("/schedule")}
                  size="sm"
                  className="text-sm sm:text-base"
                >
                  Browse Sessions
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {upcomingSessions.slice(0, 3).map((session) => (
                <Card
                  key={session.id}
                  className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push("/schedule")}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold break-words">
                          {session.title}
                        </h3>
                        <Badge
                          variant={
                            session.type === "group" ? "default" : "secondary"
                          }
                          className="capitalize text-xs sm:text-sm"
                        >
                          {session.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatDate(session.nextDate)}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {session.time}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          {session.tutor}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 shrink-0">
                      {session.type === "group" ? (
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      ) : (
                        <Video className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {upcomingSessions.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/schedule")}
                >
                  View {upcomingSessions.length - 3} more session
                  {upcomingSessions.length - 3 !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Recent Activities */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
          Recent Activities
        </h2>
        <div className="grid gap-3 sm:gap-4">
          {recentActivities.map((activity) => (
            <Card
              key={activity.id}
              className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold break-words">
                      {activity.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="capitalize text-xs sm:text-sm"
                    >
                      {activity.type}
                    </Badge>
                    <Badge className="bg-green-500 hover:bg-green-500 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>{activity.date}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-semibold text-primary">
                      +{activity.xp} XP
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-semibold text-foreground">
                      Score: {activity.score}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 shrink-0">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                    {activity.score}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
          Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`p-4 sm:p-5 md:p-6 ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/10 to-accent/10"
                  : "opacity-60"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-4xl sm:text-5xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold mb-1 break-words">
                    {achievement.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    {achievement.description}
                  </p>
                  {achievement.unlocked ? (
                    <Badge className="bg-green-500 hover:bg-green-500 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
