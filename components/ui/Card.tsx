import * as React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  as?: React.ElementType;
  /** Adds a hover lift effect — use for clickable cards */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "0",
  sm: "12px",
  md: "20px",
  lg: "28px",
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
      className={className}
      data-interactive={interactive ? "true" : undefined}
      style={{
        backgroundColor: "rgba(245, 245, 235, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(8, 72, 110, 0.22)",
        borderRadius: "var(--radius-lg)",
        padding: paddingMap[padding],
        boxShadow: interactive
          ? "var(--recall-card-shadow, var(--shadow-sm))"
          : "var(--shadow-sm)",
        transition: "box-shadow var(--transition-base), transform var(--transition-base)",
        transform: interactive
          ? "var(--recall-card-transform, translateY(0))"
          : "translateY(0)",
        cursor: interactive ? "pointer" : undefined,
        color: "#08486e",
        ["--color-text-primary" as any]: "#08486e",
        ["--color-text-secondary" as any]: "rgba(8, 72, 110, 0.85)",
        ["--color-text-muted" as any]: "rgba(8, 72, 110, 0.65)",
        ["--color-border" as any]: "rgba(8, 72, 110, 0.15)",
        ["--color-button-bg" as any]: "#000000",
        ["--color-button-text" as any]: "#f5f5eb",
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
        borderBottom: "1px solid var(--color-border)",
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
        color: "#08486e",
        ...style,
      }}
    >
      {children}
    </h3>
  );
}
