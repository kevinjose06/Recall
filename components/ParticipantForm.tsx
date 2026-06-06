"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Question } from "@/lib/types";

interface ParticipantFormProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
  questions: Question[];
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const STORAGE_KEY_PREFIX = "recall_respondent_";

type FormState = "idle" | "submitting" | "success" | "already_submitted" | "error";

export function ParticipantForm({
  eventId,
  eventTitle,
  eventType,
  questions,
}: ParticipantFormProps) {
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState("");

  // Check and set respondent token
  React.useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${eventId}`;
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      setFormState("already_submitted");
    }
  }, [eventId]);

  function setSingleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  }

  function toggleMultiAnswer(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) ?? [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: next };
    });
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    let valid = true;

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (q.question_type === "single_choice") {
        if (!answer || (answer as string).trim() === "") {
          errors[q.id] = "Please select an option.";
          valid = false;
        }
      } else if (q.question_type === "mcq") {
        if (!answer || (answer as string[]).length === 0) {
          errors[q.id] = "Please select at least one option.";
          valid = false;
        }
      } else if (q.question_type === "short_text") {
        if (!answer || (answer as string).trim() === "") {
          errors[q.id] = "Please enter a response.";
          valid = false;
        }
      }
    });

    setValidationErrors(errors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const firstErrorId = questions.find((q) => validationErrors[q.id])?.id;
      if (firstErrorId) {
        document.getElementById(`question-${firstErrorId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setFormState("submitting");
    setSubmitError("");

    const storageKey = `${STORAGE_KEY_PREFIX}${eventId}`;
    const respondentToken = generateUUID();

    const payload = {
      event_id: eventId,
      respondent_token: respondentToken,
      answers: questions.map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id],
      })),
    };

    try {
      const res = await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setFormState("already_submitted");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed");
      }

      // Persist token to prevent duplicate submissions
      localStorage.setItem(storageKey, respondentToken);
      setFormState("success");
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setFormState("idle");
    }
  }

  // ── Already submitted ──────────────────────────────────────
  if (formState === "already_submitted") {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--color-warning-subtle)",
            border: "1px solid var(--color-warning-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "var(--color-warning)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Already submitted</h2>
        <p style={{ color: "var(--color-text-muted)", maxWidth: "320px", margin: "0 auto", fontSize: "0.9rem" }}>
          You have already submitted feedback for this event from this browser. Thank you for your response!
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────
  if (formState === "success") {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--color-success-subtle)",
            border: "1px solid var(--color-success-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "var(--color-success)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M5 14l7 7 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Thank you!</h2>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "360px", margin: "0 auto", fontSize: "0.95rem", lineHeight: 1.7 }}>
          Your feedback for{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{eventTitle}</strong> has been
          recorded. The CSA team will review your responses.
        </p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Feedback form for ${eventTitle}`}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {questions.map((question, idx) => (
          <div
            key={question.id}
            id={`question-${question.id}`}
            style={{
              backgroundColor: "var(--color-bg-surface)",
              border: `1px solid ${validationErrors[question.id] ? "var(--color-error-border)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              transition: "border-color var(--transition-fast)",
            }}
          >
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "14px",
                  lineHeight: 1.45,
                  float: "left",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Q{idx + 1} ·{" "}
                  {question.question_type === "single_choice"
                    ? "Choose one"
                    : question.question_type === "mcq"
                    ? "Choose all that apply"
                    : "Short answer"}
                </span>
                {question.question_text}
              </legend>

              <div style={{ clear: "both" }}>
                {/* Single choice — radio */}
                {question.question_type === "single_choice" &&
                  (question.options ?? []).map((option) => (
                    <label
                      key={option}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        transition: "background-color var(--transition-fast)",
                        backgroundColor:
                          answers[question.id] === option
                            ? "var(--color-accent-subtle)"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (answers[question.id] !== option) {
                          e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (answers[question.id] !== option) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => setSingleAnswer(question.id, option)}
                        style={{ accentColor: "var(--color-accent)", width: "16px", height: "16px", flexShrink: 0 }}
                        aria-describedby={validationErrors[question.id] ? `error-${question.id}` : undefined}
                      />
                      <span style={{ fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                        {option}
                      </span>
                    </label>
                  ))}

                {/* MCQ — checkboxes */}
                {question.question_type === "mcq" &&
                  (question.options ?? []).map((option) => {
                    const selected = ((answers[question.id] as string[]) ?? []).includes(option);
                    return (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          transition: "background-color var(--transition-fast)",
                          backgroundColor: selected ? "var(--color-accent-subtle)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = "var(--color-bg-subtle)";
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={selected}
                          onChange={() => toggleMultiAnswer(question.id, option)}
                          style={{ accentColor: "var(--color-accent)", width: "16px", height: "16px", flexShrink: 0 }}
                          aria-describedby={validationErrors[question.id] ? `error-${question.id}` : undefined}
                        />
                        <span style={{ fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
                          {option}
                        </span>
                      </label>
                    );
                  })}

                {/* Short text — textarea */}
                {question.question_type === "short_text" && (
                  <textarea
                    value={(answers[question.id] as string) ?? ""}
                    onChange={(e) => setSingleAnswer(question.id, e.target.value)}
                    rows={4}
                    aria-label={question.question_text}
                    aria-describedby={validationErrors[question.id] ? `error-${question.id}` : undefined}
                    aria-invalid={!!validationErrors[question.id]}
                    placeholder="Your response…"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${validationErrors[question.id] ? "var(--color-error-border)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-bg-subtle)",
                      color: "var(--color-text-primary)",
                      fontSize: "0.9375rem",
                      fontFamily: "var(--font-sans)",
                      resize: "vertical",
                      outline: "none",
                      lineHeight: 1.6,
                      transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-focus)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px hsl(231 48% 48% / 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = validationErrors[question.id]
                        ? "var(--color-error-border)"
                        : "var(--color-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                )}
              </div>

              {/* Validation error */}
              {validationErrors[question.id] && (
                <p
                  id={`error-${question.id}`}
                  role="alert"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-error)",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 10.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm.75-3.25a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0v3z" />
                  </svg>
                  {validationErrors[question.id]}
                </p>
              )}
            </fieldset>
          </div>
        ))}
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-error-subtle)",
            border: "1px solid var(--color-error-border)",
            color: "var(--color-error)",
            fontSize: "0.875rem",
          }}
        >
          {submitError}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <Button
          type="submit"
          size="lg"
          isLoading={formState === "submitting"}
          style={{ width: "100%" }}
        >
          {formState === "submitting" ? "Submitting…" : "Submit feedback"}
        </Button>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center", marginTop: "10px" }}>
          Your response is anonymous and will be visible only to CSA members.
        </p>
      </div>
    </form>
  );
}
