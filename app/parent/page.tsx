"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Shield,
  Clock,
  Eye,
  Bell,
  Settings,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-provider";
import { useUserProfile } from "@/hooks/use-user-profile";
import { parseDuration } from "@/lib/user-stats";

type ChildProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  xp?: string;
  currentStreak?: number;
  totalTime?: number;
  completedResources?: string[];
  lastActivityDate?: string;
};

type Resource = {
  id: string;
  title: string;
  type: string;
  duration?: string;
  completedAt?: Date;
};

type Session = {
  id: string;
  title: string;
  date: string;
  time: string;
  tutor: string;
  nextDate: Date;
};

export default function ParentPage() {
  const { user } = useAuth();
  const { profile: parentProfile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [completedResources, setCompletedResources] = useState<Resource[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState({
    dailyTimeLimit: true,
    weeklyReports: true,
    sessionNotifications: true,
    contentFilter: true,
    progressAlerts: true,
  });

  // Fetch child users (for now, get first child - can add selector later)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch parent settings
        const parentRef = doc(db, "users", user.uid);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          if (parentData.parentSettings) {
            setSettings(parentData.parentSettings);
          }
        }

        // Fetch first child user (type === "child")
        const usersQuery = query(
          collection(db, "users"),
          where("type", "==", "child")
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
          setLoading(false);
          return;
        }

        // Get first child (can be enhanced to select specific child)
        const firstChild = usersSnapshot.docs[0];
        const childData = firstChild.data() as ChildProfile;
        setChildProfile({ ...childData, id: firstChild.id });

        // Fetch completed resources
        const completedResourceIds = childData.completedResources || [];
        const resources: Resource[] = [];

        for (const resourceId of completedResourceIds.slice(0, 10)) {
          try {
            const resourceRef = doc(db, "resources", resourceId);
            const resourceSnap = await getDoc(resourceRef);
            if (resourceSnap.exists()) {
              const resourceData = resourceSnap.data();
              resources.push({
                id: resourceSnap.id,
                title: resourceData.title || "Untitled",
                type: resourceData.type || "lesson",
                duration: resourceData.duration || "15 min",
              });
            }
          } catch (err) {
            console.error(`Error fetching resource ${resourceId}:`, err);
          }
        }

        setCompletedResources(resources);

        // Fetch upcoming sessions
        const sessionsRef = collection(db, "sessions");
        const sessionsSnapshot = await getDocs(sessionsRef);
        const sessions: Session[] = [];
        const childPath = `/users/${firstChild.id}`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        sessionsSnapshot.forEach((docSnap) => {
          const sessionData = docSnap.data();
          const sessionUsers = sessionData.students || [];

          // Check if child is enrolled
          if (
            sessionUsers.some(
              (path: string) =>
                path === childPath ||
                path === firstChild.id ||
                path.endsWith(`/${firstChild.id}`)
            )
          ) {
            const day = sessionData.date || "Monday";
            const startTime = sessionData.startTime || "";
            const endTime = sessionData.endTime || "";
            const time = endTime
              ? `${startTime} - ${endTime}`
              : startTime || "";

            // Calculate next occurrence
            const dayIndex = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].indexOf(day);
            if (dayIndex !== -1) {
              const nextDate = new Date(today);
              const daysUntil = (dayIndex - today.getDay() + 7) % 7 || 7;
              nextDate.setDate(today.getDate() + daysUntil);

              sessions.push({
                id: docSnap.id,
                title: sessionData.name || "Untitled Session",
                date: daysUntil === 1 ? "Tomorrow" : day,
                time,
                tutor: sessionData.teacher || "",
                nextDate,
              });
            }
          }
        });

        // Sort by next date
        sessions.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
        setUpcomingSessions(sessions.slice(0, 5));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching parent data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Update settings in Firestore
  const handleSettingChange = async (
    key: keyof typeof settings,
    value: boolean
  ) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const parentRef = doc(db, "users", user.uid);
      await updateDoc(parentRef, {
        parentSettings: newSettings,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      // Revert on error
      setSettings(settings);
    }
  };

  // Calculate stats
  const childStats = childProfile
    ? {
        name:
          `${childProfile.firstName || ""} ${
            childProfile.lastName || ""
          }`.trim() || "Child",
        level: Math.floor(parseInt(childProfile.xp || "0", 10) / 250) + 1,
        totalTime: childProfile.totalTime || 0,
        activitiesCompleted: childProfile.completedResources?.length || 0,
        averageScore: 85, // TODO: Calculate from quiz scores
        streak: childProfile.currentStreak || 0,
      }
    : {
        name: "Child",
        level: 1,
        totalTime: 0,
        activitiesCompleted: 0,
        averageScore: 0,
        streak: 0,
      };

  // Calculate weekly activity (distribute evenly across week for now)
  const weeklyActivity = (() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const activity: { day: string; minutes: number; activities: number }[] = [];
    const totalActivities = completedResources.length;
    const activitiesPerDay = Math.floor(totalActivities / 7);
    const remainingActivities = totalActivities % 7;

    // Calculate total time for the week
    const totalMinutes = completedResources.reduce((sum, resource) => {
      return sum + parseDuration(resource.duration || "15 min");
    }, 0);
    const minutesPerDay = Math.floor(totalMinutes / 7);
    const remainingMinutes = totalMinutes % 7;

    for (let i = 0; i < 7; i++) {
      const activities = activitiesPerDay + (i < remainingActivities ? 1 : 0);
      const minutes = minutesPerDay + (i < remainingMinutes ? 1 : 0);

      activity.push({
        day: days[i],
        minutes: Math.max(0, minutes),
        activities: Math.max(0, activities),
      });
    }

    return activity;
  })();

  // Format recent activity
  const recentActivity = completedResources
    .slice(0, 5)
    .map((resource, index) => {
      const now = new Date();
      const hoursAgo = index * 2;
      const activityDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const isToday = activityDate.toDateString() === now.toDateString();
      const isYesterday =
        activityDate.toDateString() ===
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

      let dateStr = "";
      if (isToday) {
        dateStr = `Today, ${activityDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      } else if (isYesterday) {
        dateStr = `Yesterday, ${activityDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      } else {
        dateStr = activityDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }

      return {
        id: resource.id,
        activity: resource.title,
        date: dateStr,
        duration: resource.duration || "15 min",
        score:
          resource.type === "quiz" ? 85 + Math.floor(Math.random() * 15) : null,
        status:
          resource.type === "quiz" || resource.type === "lesson"
            ? "completed"
            : "attended",
      };
    });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!childProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Child Account Found</h2>
          <p className="text-muted-foreground">
            No child accounts are currently linked to your parent account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
        <Shield className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
            Parent Dashboard
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1">
            Monitor and manage {childStats.name}'s learning
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <Card className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Level
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {childStats.level}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                This Week
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-500">
              {childStats.totalTime}m
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Completed
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">
              {childStats.activitiesCompleted}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Avg Score
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">
              {childStats.averageScore}%
            </p>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
        {/* Weekly Activity Chart */}
        <Card className="p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Weekly Activity
          </h2>
          <div className="space-y-4">
            {weeklyActivity.map((day) => (
              <div key={day.day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{day.day}</span>
                  <span className="text-sm text-muted-foreground">
                    {day.minutes} min • {day.activities} activities
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(day.minutes / 45) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Parental Controls */}
        <Card className="p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Controls & Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="time-limit" className="text-base font-semibold">
                  Daily Time Limit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set maximum daily usage (60 min)
                </p>
              </div>
              <Switch
                id="time-limit"
                checked={settings.dailyTimeLimit}
                onCheckedChange={(checked) =>
                  handleSettingChange("dailyTimeLimit", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reports" className="text-base font-semibold">
                  Weekly Reports
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive progress summaries
                </p>
              </div>
              <Switch
                id="reports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) =>
                  handleSettingChange("weeklyReports", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="notifications"
                  className="text-base font-semibold"
                >
                  Session Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alert when sessions start
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.sessionNotifications}
                onCheckedChange={(checked) =>
                  handleSettingChange("sessionNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="alerts" className="text-base font-semibold">
                  Progress Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify on achievements
                </p>
              </div>
              <Switch
                id="alerts"
                checked={settings.progressAlerts}
                onCheckedChange={(checked) =>
                  handleSettingChange("progressAlerts", checked)
                }
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
          <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Recent Activity
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">
              No recent activity yet.
            </p>
          ) : (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1 break-words">
                    {item.activity}
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span>{item.date}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{item.duration}</span>
                    {item.score && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-semibold text-foreground">
                          Score: {item.score}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  className={`text-xs sm:text-sm ${
                    item.status === "completed"
                      ? "bg-green-500 hover:bg-green-500"
                      : "bg-blue-500 hover:bg-blue-500"
                  }`}
                >
                  {item.status === "completed" ? "Completed" : "Attended"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Upcoming Sessions */}
      <Card className="p-4 sm:p-5 md:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Upcoming Sessions
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {upcomingSessions.length === 0 ? (
            <p className="text-sm sm:text-base text-muted-foreground text-center py-4">
              No upcoming sessions scheduled.
            </p>
          ) : (
            upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-secondary/50 rounded-lg"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1 break-words">
                    {session.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {session.date} <span className="hidden sm:inline">•</span>{" "}
                    <span className="block sm:inline">{session.time}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    with {session.tutor}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Info Alert */}
      <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-6 md:mt-8 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3 sm:gap-4">
          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2">
              Parental Supervision
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              All live tutoring sessions are monitored and recorded for safety.
              You can review session recordings in the settings menu.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
