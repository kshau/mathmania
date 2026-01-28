import type { AccessibilitySettings } from "@/contexts/accessibility-provider";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  type: "child" | "parent" | "admin";

  // For child
  level?: number;
  xp?: number;
  character?: string; // Avatar
  color?: string;
  currentStreak?: number;
  totalTime?: number; // in minutes
  lastActivityDate?: string; // ISO date string
  completedResources?: string[];
  achievements?: string[]; // e.g., ['First Quiz Completed', '10-day streak']

  // For parent
  children?: string[]; // array of child uids

  // For all users
  settings: AccessibilitySettings;

  // Sessions will be a separate collection, but we can store registered session IDs here
  registeredSessions?: string[];
};
