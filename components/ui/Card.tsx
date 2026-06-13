import * as React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  as?: React.ElementType;
  /** Adds a hover lift + glow effect — use for clickable cards */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "0",
  sm: "12px",
  md: "20px",
  lg: "24px",
};

export function Card({
  children,
  style,
  className,
  as: As = "div",
  interactive = false,
  padding = "md",
}: CardProps) {
  return (
    <As
      className={`glass-panel${className ? ` ${className}` : ""}`}
      data-interactive={interactive ? "true" : undefined}
      style={{
        /* glassmorphism: obsidian glass */
        background: "rgba(13, 13, 13, 0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "var(--radius-lg)",
        padding: paddingMap[padding],
        boxShadow: interactive
          ? "var(--recall-card-shadow, var(--shadow-sm))"
          : "var(--shadow-sm)",
        transition:
          "box-shadow var(--transition-base), transform var(--transition-base), border-color var(--transition-base)",
        transform: interactive
          ? "var(--recall-card-transform, translateY(0))"
          : "translateY(0)",
        cursor: interactive ? "pointer" : undefined,
        /* text token overrides — stay on-surface inside dark cards */
        color: "var(--color-on-surface)",
        ["--color-text-primary" as any]: "var(--color-on-surface)",
        ["--color-text-secondary" as any]: "var(--color-on-surface-variant)",
        ["--color-text-muted" as any]: "var(--color-outline)",
        ["--color-border" as any]: "rgba(255, 255, 255, 0.08)",
        ["--color-button-bg" as any]: "#0070f3",
        ["--color-button-text" as any]: "#ffffff",
        ...style,
      } as React.CSSProperties}
    >
      {children}
    </As>
  );
}

// ─── Card sub-components ───────────────────────────────────────

export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        paddingBottom: "16px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h3
      style={{
        fontSize: "1.0625rem",
        fontWeight: 600,
        color: "var(--color-on-surface)",
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {children}
    </h3>
  );
}
