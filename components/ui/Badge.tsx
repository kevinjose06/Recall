import * as React from "react";

// ─── Badge Input types ─────────────────────────────────────────
import type { EventType } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  style?: React.CSSProperties;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      /* surface-container-high glass chip */
      backgroundColor: "rgba(174, 198, 255, 0.06)",
      color: "var(--color-on-surface-variant)",
      border: "1px solid rgba(255, 255, 255, 0.10)",
    },
    accent: {
      /* primary blue chip */
      backgroundColor: "rgba(0, 112, 243, 0.15)",
      color: "#aec6ff",
      border: "1px solid rgba(174, 198, 255, 0.30)",
    },
    success: {
      /* emerald secondary chip */
      backgroundColor: "rgba(78, 222, 163, 0.12)",
      color: "#4edea3",
      border: "1px solid rgba(78, 222, 163, 0.30)",
    },
    warning: {
      /* tertiary warm orange chip */
      backgroundColor: "rgba(255, 181, 150, 0.12)",
      color: "#ffb596",
      border: "1px solid rgba(255, 181, 150, 0.30)",
    },
    error: {
      backgroundColor: "var(--color-error-subtle)",
      color: "var(--color-error)",
      border: "1px solid var(--color-error-border)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "22px",
        padding: "0 10px",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 500,
        fontFamily: "var(--font-label)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Event Type Badge ───────────────────────────────────────────
const EVENT_TYPE_VARIANTS: Record<EventType, BadgeProps["variant"]> = {
  Workshop:         "accent",
  Bootcamp:         "success",
  Hackathon:        "warning",
  "Technical Talk": "default",
  Other:            "default",
};

interface EventTypeBadgeProps {
  type: EventType;
}

export function EventTypeBadge({ type }: EventTypeBadgeProps) {
  return <Badge variant={EVENT_TYPE_VARIANTS[type]}>{type}</Badge>;
}
