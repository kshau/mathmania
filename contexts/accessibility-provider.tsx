"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-provider";
import { getUserSettings, updateUserSettings } from "@/lib/user-settings";

export type FontSize = "small" | "medium" | "large" | "extra-large";
export type ColorMode = "light" | "dark" | "system";

interface AccessibilitySettings {
  colorMode: ColorMode;
  highContrast: boolean;
  fontSize: FontSize;
  reduceMotion: boolean;
  increasedSpacing: boolean;
  screenReaderOptimized: boolean;
  focusIndicators: boolean;
  underlineLinks: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetToDefaults: () => void;
}

const defaultSettings: AccessibilitySettings = {
  colorMode: "light",
  highContrast: false,
  fontSize: "medium",
  reduceMotion: false,
  increasedSpacing: false,
  screenReaderOptimized: false,
  focusIndicators: true,
  underlineLinks: false,
};

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage or Firestore on mount
  useEffect(() => {
    setMounted(true);
    const loadSettings = async () => {
      if (user && !loading) {
        const firestoreSettings = await getUserSettings(user.uid);
        if (firestoreSettings) {
          setSettings({ ...defaultSettings, ...firestoreSettings as AccessibilitySettings });
        } else {
          // If no settings in Firestore, check localStorage
          const stored = localStorage.getItem("accessibility-settings");
          if (stored) {
            try {
              setSettings({ ...defaultSettings, ...JSON.parse(stored) });
            } catch {
              setSettings(defaultSettings);
            }
          }
        }
      } else if (!user && !loading) {
        // If no user, load from localStorage
        const stored = localStorage.getItem("accessibility-settings");
        if (stored) {
          try {
            setSettings({ ...defaultSettings, ...JSON.parse(stored) });
          } catch {
            setSettings(defaultSettings);
          }
        }
      }
    };
    loadSettings();
  }, [user, loading]);

  // Save settings to localStorage and apply classes
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("accessibility-settings", JSON.stringify(settings));

    const html = document.documentElement;
    const body = document.body;

    // Color mode
    if (settings.colorMode === "dark") {
      html.classList.add("dark");
    } else if (settings.colorMode === "light") {
      html.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      html.classList.toggle("dark", prefersDark);
    }

    // High contrast
    html.classList.toggle("high-contrast", settings.highContrast);

    // Font size
    html.classList.remove(
      "font-size-small",
      "font-size-medium",
      "font-size-large",
      "font-size-extra-large"
    );
    html.classList.add(`font-size-${settings.fontSize}`);

    // Reduce motion
    html.classList.toggle("reduce-motion", settings.reduceMotion);

    // Increased spacing
    body.classList.toggle("increased-spacing", settings.increasedSpacing);

    // Focus indicators
    if (settings.focusIndicators) {
      html.style.setProperty("--focus-ring-width", "3px");
    } else {
      html.style.setProperty("--focus-ring-width", "1px");
    }

    // Underline links
    const style =
      document.getElementById("accessibility-styles") ||
      document.createElement("style");
    style.id = "accessibility-styles";
    style.textContent = settings.underlineLinks
      ? "a { text-decoration: underline !important; }"
      : "";
    if (!document.getElementById("accessibility-styles")) {
      document.head.appendChild(style);
    }
  }, [settings, mounted]);

  // Listen for system color scheme changes
  useEffect(() => {
    if (!mounted || settings.colorMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mounted, settings.colorMode]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      if (user) {
        updateUserSettings(user.uid, newSettings);
      }
      return newSettings;
    });
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    if (user) {
      updateUserSettings(user.uid, defaultSettings);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSetting, resetToDefaults }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider"
    );
  }
  return context;
}
