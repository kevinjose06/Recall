"use client";

import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.7 5.2A9.9 9.9 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-2.3 3.2" />
      <path d="M6.6 6.6A17.4 17.4 0 0 0 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4.1-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, hideLabel = false, id, style, type, disabled, ...props },
    ref
  ) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPasswordInput = type === "password";
    const resolvedType =
      isPasswordInput && isPasswordVisible ? "text" : type;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor={inputId}
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            fontFamily: "var(--font-label)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-on-surface-variant)",
            ...(hideLabel
              ? {
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                }
              : {}),
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

        <div style={{ position: "relative", width: "100%" }}>
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            aria-describedby={describedBy || undefined}
            aria-invalid={!!error}
            {...props}
            style={{
              height: "42px",
              padding: isPasswordInput ? "0 48px 0 14px" : "0 14px",
              /* surface-container-lowest for deep dark fields */
              backgroundColor: "#0e0e0e",
              border: `1px solid ${error ? "var(--color-error-border)" : "rgba(255, 255, 255, 0.08)"}`,
              borderRadius: "var(--radius-md)",
              color: "#e5e2e1",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-sans)",
              outline: "none",
              transition:
                "border-color var(--transition-fast), box-shadow var(--transition-fast)",
              width: "100%",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error
                ? "var(--color-error)"
                : "#aec6ff";
              e.currentTarget.style.boxShadow = `0 0 10px ${
                error
                  ? "rgba(255, 180, 171, 0.15)"
                  : "rgba(174, 198, 255, 0.20)"
              }`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? "var(--color-error-border)"
                : "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
          />

          {isPasswordInput && (
            <button
              type="button"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
              title={isPasswordVisible ? "Hide password" : "Show password"}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              style={{
                position: "absolute",
                top: "50%",
                right: "8px",
                transform: "translateY(-50%)",
                width: "32px",
                height: "32px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "0",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                color: disabled
                  ? "rgba(229, 226, 225, 0.35)"
                  : "var(--color-on-surface-variant)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>

        {hint && !error && (
          <p
            id={hintId}
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-outline)",
            }}
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-error)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0v3z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


// ─── Textarea variant ──────────────────────────────────────────

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const inputId =
      id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor={inputId}
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            fontFamily: "var(--font-label)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-on-surface-variant)",
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

        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error}
          rows={4}
          style={{
            padding: "12px 14px",
            backgroundColor: "#0e0e0e",
            border: `1px solid ${error ? "var(--color-error-border)" : "rgba(255, 255, 255, 0.08)"}`,
            borderRadius: "var(--radius-md)",
            color: "#e5e2e1",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-sans)",
            outline: "none",
            resize: "vertical",
            transition:
              "border-color var(--transition-fast), box-shadow var(--transition-fast)",
            width: "100%",
            lineHeight: 1.6,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--color-error)"
              : "#aec6ff";
            e.currentTarget.style.boxShadow = `0 0 10px ${
              error
                ? "rgba(255, 180, 171, 0.15)"
                : "rgba(174, 198, 255, 0.20)"
            }`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--color-error-border)"
              : "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
          {...props}
        />

        {hint && !error && (
          <p
            id={hintId}
            style={{ fontSize: "0.8125rem", color: "var(--color-outline)" }}
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-error)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0v3z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
