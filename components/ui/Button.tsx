import * as React from "react";

// ─── Types ────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
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
        backgroundColor: "var(--color-button-bg)",
        color: "var(--color-button-text)",
        border: "1px solid transparent",
      };
    case "secondary":
      return {
        backgroundColor: "var(--color-bg-subtle)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        border: "1px solid transparent",
      };
    case "danger":
      return {
        backgroundColor: "var(--color-error-subtle)",
        color: "var(--color-error)",
        border: "1px solid var(--color-error-border)",
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

    const combinedStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.55 : 1,
      transition: "background-color var(--transition-fast), opacity var(--transition-fast), box-shadow var(--transition-fast)",
      textDecoration: "none",
      whiteSpace: "nowrap",
      flexShrink: 0,
      ...getVariantStyle(variant),
      ...getSizeStyle(size),
      ...style,
    };

    return (
      <button
        ref={ref}
        className={`${className || ""} slide-fill-btn`}
        disabled={isDisabled}
        style={combinedStyle}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
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
