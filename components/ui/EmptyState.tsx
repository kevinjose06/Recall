import * as React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: "16px",
      }}
    >
      {icon ? (
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
          }}
        >
          {icon}
        </div>
      ) : (
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 13h4M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "320px" }}>
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--color-text-muted)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
