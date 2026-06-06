import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, id, children, style, ...props }, ref) => {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor={selectId}
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text-primary)",
          }}
        >
          {label}
          {props.required && (
            <span
              aria-hidden="true"
              style={{ color: "var(--color-error)", marginLeft: "3px" }}
            >
              *
            </span>
          )}
        </label>

        <div style={{ position: "relative" }}>
          <select
            ref={ref}
            id={selectId}
            aria-describedby={describedBy || undefined}
            aria-invalid={!!error}
            style={{
              height: "40px",
              padding: "0 36px 0 12px",
              backgroundColor: "rgb(4, 14, 24)",
              border: `1px solid ${error ? "var(--color-error-border)" : "rgba(245, 245, 235, 0.22)"}`,
              borderRadius: "var(--radius-md)",
              color: "#f5f5eb",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-sans)",
              outline: "none",
              width: "100%",
              appearance: "none",
              cursor: "pointer",
              transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? "var(--color-error)"
                : "var(--color-border-focus)";
              e.currentTarget.style.boxShadow = `0 0 0 3px ${
                error ? "hsl(4 70% 48% / 0.12)" : "hsl(231 48% 48% / 0.12)"
              }`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? "var(--color-error-border)"
                : "rgba(245, 245, 235, 0.22)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          {/* Chevron icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "var(--color-text-muted)",
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {hint && !error && (
          <p id={hintId} style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            style={{ fontSize: "0.8125rem", color: "var(--color-error)", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0v3z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
