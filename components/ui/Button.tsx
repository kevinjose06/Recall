"use client";

import * as React from "react";


// ─── Types ────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "secondary-light";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ─── Styles ───────────────────────────────────────────────────
function getVariantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: "#002e6b",                   /* Dark Blue background */
        color: "#ffffff",                             /* White text */
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "transparent",
      };
    case "secondary":
      return {
        backgroundColor: "rgba(123, 164, 255, 0.06)",
        color: "var(--color-text-primary)",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "var(--color-border)",
      };
    case "secondary-light":
      return {
        backgroundColor: "#7ba4ff",                   /* Light Purple background */
        color: "#001a43",                             /* Dark text */
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "#7ba4ff",
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "transparent",
      };
    case "danger":
      return {
        backgroundColor: "var(--color-error-subtle)",
        color: "var(--color-error)",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: "var(--color-error-border)",
      };
  }
}

function getSizeStyle(size: ButtonSize): React.CSSProperties {
  switch (size) {
    case "sm":
      return {
        height: "32px",
        padding: "0 16px",
        fontSize: "0.8125rem",
        borderRadius: "var(--radius-full)",
        gap: "6px",
      };
    case "md":
      return {
        height: "38px",
        padding: "0 20px",
        fontSize: "0.9375rem",
        borderRadius: "var(--radius-full)",
        gap: "8px",
      };
    case "lg":
      return {
        height: "44px",
        padding: "0 24px",
        fontSize: "1rem",
        borderRadius: "var(--radius-full)",
        gap: "8px",
      };
  }
}

// ─── Component ────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      style,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const [hovered, setHovered] = React.useState(false);

    const baseVariantStyles = getVariantStyle(variant);

    // Dynamic style calculation ensuring slide overlay behavior
    const combinedStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.55 : 1,
      transition: "color 0.3s ease, border-color 0.3s ease, opacity 0.2s ease, transform 0.1s ease",
      textDecoration: "none",
      whiteSpace: "nowrap",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden",
      zIndex: 1,
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
      ...baseVariantStyles,
      ...getSizeStyle(size),
      ...style,
    };

    // Hover dynamic color overrides to match slider flow
    if (hovered && !isDisabled) {
      if (variant === "secondary-light") {
        combinedStyle.borderColor = "#002e6b";
        combinedStyle.color = "#ffffff";
      } else if (variant === "ghost") {
        combinedStyle.borderColor = "transparent";
        combinedStyle.color = "#001a43";
      } else {
        combinedStyle.borderColor = "#7ba4ff";
        combinedStyle.color = "#001a43";
      }
    }

    return (
      <button
        ref={ref}
        className={`slide-fill-btn ${className || ""}`}
        disabled={isDisabled}
        style={{
          ...combinedStyle,
          ["--color-hover-fill" as any]: variant === "secondary-light" ? "#002e6b" : "#7ba4ff",
          ["--color-hover-text" as any]: variant === "secondary-light" ? "#ffffff" : "#001a43",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center" }}>
            <Spinner size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
          </span>
        ) : (
          leftIcon && (
            <span style={{ color: "inherit", display: "inline-flex", alignItems: "center", position: "relative", zIndex: 2 }}>
              {leftIcon}
            </span>
          )
        )}
        <span style={{ position: "relative", zIndex: 2, color: "inherit" }}>{children}</span>
        {!isLoading && rightIcon && (
          <span style={{ color: "inherit", display: "inline-flex", alignItems: "center", position: "relative", zIndex: 2 }}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);



Button.displayName = "Button";

// ─── Inline Spinner ───────────────────────────────────────────
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{
        animation: "recall-spin 0.75s linear infinite",
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes recall-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="10"
        opacity="0.35"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
