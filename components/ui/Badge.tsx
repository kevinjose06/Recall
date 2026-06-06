import * as React from "react";
import type { EventType } from "@/lib/types";

// ─── Generic Badge ─────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  style?: React.CSSProperties;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--color-bg-subtle)",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    },
    accent: {
      backgroundColor: "var(--color-accent-subtle)",
      color: "var(--color-accent)",
      border: "1px solid var(--color-accent-border)",
    },
    success: {
      backgroundColor: "var(--color-success-subtle)",
      color: "var(--color-success)",
      border: "1px solid var(--color-success-border)",
    },
    warning: {
      backgroundColor: "var(--color-warning-subtle)",
      color: "var(--color-warning)",
      border: "1px solid var(--color-warning-border)",
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
        padding: "0 8px",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 500,
        letterSpacing: "0.01em",
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
  Workshop: "accent",
  Bootcamp: "success",
  Hackathon: "warning",
  "Technical Talk": "default",
  Other: "default",
};

interface EventTypeBadgeProps {
  type: EventType;
}

export function EventTypeBadge({ type }: EventTypeBadgeProps) {
  return <Badge variant={EVENT_TYPE_VARIANTS[type]}>{type}</Badge>;
}
