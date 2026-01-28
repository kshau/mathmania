"use client";

import {
  useAccessibility,
  type ColorMode,
  type FontSize,
} from "@/contexts/accessibility-provider";
import { SettingSection } from "./settings-section";
import { SettingRow } from "./settings-row";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor, Type, RotateCcw } from "lucide-react";

export function AccessibilitySettings() {
  const { settings, updateSetting, resetToDefaults } = useAccessibility();

  return (
    <div className="space-y-6">
      {/* Appearance Section */}
      <SettingSection
        title="Appearance"
        description="Customize how the interface looks"
      >
        <SettingRow
          label="Color Mode"
          description="Choose between light, dark, or system preference"
          htmlFor="color-mode"
        >
          <Select
            value={settings.colorMode}
            onValueChange={(value: ColorMode) =>
              updateSetting("colorMode", value)
            }
          >
            <SelectTrigger id="color-mode" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <span className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="High Contrast Mode"
          description="Increase contrast for better visibility"
          htmlFor="high-contrast"
        >
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={(checked) =>
              updateSetting("highContrast", checked)
            }
            aria-label="Toggle high contrast mode"
          />
        </SettingRow>
      </SettingSection>

      {/* Text Section */}
      <SettingSection
        title="Text & Readability"
        description="Adjust text size and spacing for easier reading"
      >
        <SettingRow
          label="Font Size"
          description="Adjust the base text size throughout the interface"
          htmlFor="font-size"
        >
          <Select
            value={settings.fontSize}
            onValueChange={(value: FontSize) =>
              updateSetting("fontSize", value)
            }
          >
            <SelectTrigger id="font-size" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">
                <span className="flex items-center gap-2">
                  <Type className="h-3 w-3" />
                  Small
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="large">
                <span className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Large
                </span>
              </SelectItem>
              <SelectItem value="extra-large">
                <span className="flex items-center gap-2">
                  <Type className="h-6 w-6" />
                  Extra Large
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Increased Spacing"
          description="Add extra space between letters and lines"
          htmlFor="increased-spacing"
        >
          <Switch
            id="increased-spacing"
            checked={settings.increasedSpacing}
            onCheckedChange={(checked) =>
              updateSetting("increasedSpacing", checked)
            }
            aria-label="Toggle increased spacing"
          />
        </SettingRow>

        <SettingRow
          label="Underline Links"
          description="Always show underlines on links for better visibility"
          htmlFor="underline-links"
        >
          <Switch
            id="underline-links"
            checked={settings.underlineLinks}
            onCheckedChange={(checked) =>
              updateSetting("underlineLinks", checked)
            }
            aria-label="Toggle underline links"
          />
        </SettingRow>
      </SettingSection>

      {/* Motion & Focus Section */}
      <SettingSection
        title="Motion & Focus"
        description="Control animations and focus behavior"
      >
        <SettingRow
          label="Reduce Motion"
          description="Minimize animations and transitions"
          htmlFor="reduce-motion"
        >
          <Switch
            id="reduce-motion"
            checked={settings.reduceMotion}
            onCheckedChange={(checked) =>
              updateSetting("reduceMotion", checked)
            }
            aria-label="Toggle reduce motion"
          />
        </SettingRow>

        <SettingRow
          label="Enhanced Focus Indicators"
          description="Show larger, more visible focus outlines"
          htmlFor="focus-indicators"
        >
          <Switch
            id="focus-indicators"
            checked={settings.focusIndicators}
            onCheckedChange={(checked) =>
              updateSetting("focusIndicators", checked)
            }
            aria-label="Toggle enhanced focus indicators"
          />
        </SettingRow>
      </SettingSection>

      {/* Screen Reader Section */}
      <SettingSection
        title="Assistive Technology"
        description="Optimize for screen readers and other assistive tools"
      >
        <SettingRow
          label="Screen Reader Optimization"
          description="Add additional context and labels for screen readers"
          htmlFor="screen-reader"
        >
          <Switch
            id="screen-reader"
            checked={settings.screenReaderOptimized}
            onCheckedChange={(checked) =>
              updateSetting("screenReaderOptimized", checked)
            }
            aria-label="Toggle screen reader optimization"
          />
        </SettingRow>
      </SettingSection>

      {/* Preview Section */}
      <SettingSection
        title="Preview"
        description="See how your settings affect the interface"
      >
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Sample Content</h3>
          <p className="text-muted-foreground">
            This is how your text will appear with the current settings. You can
            adjust the font size, spacing, and contrast to find what works best
            for you.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm">Primary Button</Button>
            <Button size="sm" variant="outline">
              Outline Button
            </Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
          </div>
          <p className="text-sm">
            Here is a{" "}
            <a href="#" className="text-primary hover:underline">
              sample link
            </a>{" "}
            to demonstrate link styling.
          </p>
        </div>
      </SettingSection>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="gap-2 bg-transparent"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
