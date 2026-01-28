import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 last:pb-0 first:pt-0">
      <div className="flex-1 min-w-0">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-card-foreground cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
