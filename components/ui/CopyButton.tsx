"use client";

import * as React from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copy link" }: CopyButtonProps) {
  const [state, setState] = React.useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  const config = {
    idle: {
      label,
      bg: "var(--color-bg-subtle)",
      color: "var(--color-text-secondary)",
      border: "var(--color-border)",
    },
    copied: {
      label: "Copied!",
      bg: "var(--color-success-subtle)",
      color: "var(--color-success)",
      border: "var(--color-success-border)",
    },
    error: {
      label: "Failed",
      bg: "var(--color-error-subtle)",
      color: "var(--color-error)",
      border: "var(--color-error-border)",
    },
  }[state];

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={state === "copied" ? "Link copied to clipboard" : label}
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: "36px",
        padding: "0 12px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${config.border}`,
        backgroundColor: config.bg,
        color: config.color,
        fontSize: "0.875rem",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        transition: "all var(--transition-base)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {state === "copied" ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="2" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 2V1.5A1.5 1.5 0 0 0 9.5 0h-7A1.5 1.5 0 0 0 1 1.5v10A1.5 1.5 0 0 0 2.5 13H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {config.label}
    </button>
  );
}
