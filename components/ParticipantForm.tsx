"use client";

import * as React from "react";
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
      const isRequired = q.is_required;

      if (isRequired) {
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
      <div className="text-center py-12 px-6 animate-fade-slide-up">
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-[var(--color-tertiary)]/10 border border-[var(--color-tertiary)]/20 flex items-center justify-center mx-auto mb-4 text-[var(--color-tertiary)]">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">Already submitted</h2>
        <p className="text-[var(--color-text-secondary)] max-w-[320px] mx-auto text-sm">
          You have already submitted feedback for this event from this browser. Thank you for your response!
        </p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────
  if (formState === "success") {
    return (
      <div className="text-center py-12 px-6 animate-fade-slide-up">
        <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 flex items-center justify-center mx-auto mb-5 text-[var(--color-secondary)]">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)]">Thank you!</h2>
        <p className="text-[var(--color-text-secondary)] max-w-sm mx-auto text-base leading-relaxed">
          Your feedback for <strong className="text-[var(--color-text-primary)]">{eventTitle}</strong> has been recorded. The CSA team will review your responses.
        </p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {questions.map((question, idx) => {
          const hasError = !!validationErrors[question.id];
          const delayStyle = { animationDelay: `${(idx + 2) * 0.1}s` };

          return (
            <div
              key={question.id}
              id={`question-${question.id}`}
              style={delayStyle}
              className={`glass-panel rounded-lg p-6 stagger-in transition-all duration-300 ${
                hasError ? "border-[var(--color-error)]/30 shadow-[0_0_15px_rgba(255,180,171,0.05)]" : "focus-within:border-[var(--color-primary)]/20 focus-within:shadow-[0_0_15px_rgba(174,198,255,0.1)]"
              }`}
            >
              <fieldset className="border-none p-0 m-0">
                <legend className="block w-full float-left text-[15px] font-semibold text-[var(--color-text-primary)] mb-4 leading-relaxed">
                  <span className="block font-label-caps text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                    Q{idx + 1} ·{" "}
                    {question.question_type === "single_choice"
                      ? "Choose one"
                      : question.question_type === "mcq"
                      ? "Choose all that apply"
                      : "Short answer"}
                  </span>
                  {question.question_text}
                  {question.is_required && <span className="text-[var(--color-error)] ml-1" title="Required">*</span>}
                </legend>

                <div className="clear-both flex flex-col gap-2.5">
                  {/* Single choice — custom radios */}
                  {question.question_type === "single_choice" &&
                    (question.options ?? []).map((option) => {
                      const isChecked = answers[question.id] === option;
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer border transition-all ${
                            isChecked
                              ? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                              : "bg-transparent border-white/5 text-[var(--color-text-primary)] hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={isChecked}
                            onChange={() => setSingleAnswer(question.id, option)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isChecked ? "border-[var(--color-primary)]" : "border-white/20"
                          }`}>
                            {isChecked && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"></div>
                            )}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </label>
                      );
                    })}

                  {/* MCQ — custom checkboxes */}
                  {question.question_type === "mcq" &&
                    (question.options ?? []).map((option) => {
                      const selectedOptions = (answers[question.id] as string[]) ?? [];
                      const isChecked = selectedOptions.includes(option);
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 p-3.5 rounded-lg cursor-pointer border transition-all ${
                            isChecked
                              ? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30 text-[var(--color-primary)]"
                              : "bg-transparent border-white/5 text-[var(--color-text-primary)] hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={isChecked}
                            onChange={() => toggleMultiAnswer(question.id, option)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isChecked ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-white/20"
                          }`}>
                            {isChecked && (
                              <span className="material-symbols-outlined text-[12px] text-[var(--color-on-primary)] font-bold">
                                check
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </label>
                      );
                    })}

                  {/* Short text — custom textarea input */}
                  {question.question_type === "short_text" && (
                    <textarea
                      value={(answers[question.id] as string) ?? ""}
                      onChange={(e) => setSingleAnswer(question.id, e.target.value)}
                      rows={4}
                      placeholder="Your response…"
                      className={`w-full bg-[#050505] border text-[var(--color-text-primary)] rounded-lg p-3.5 font-body-sm text-sm focus:outline-none transition-all ${
                        hasError
                          ? "border-[var(--color-error)]/30 focus:border-[var(--color-error)] focus:ring-4 focus:ring-[var(--color-error)]/10"
                          : "border-white/8 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                      }`}
                    />
                  )}
                </div>

                {/* Validation error text */}
                {hasError && (
                  <p className="text-[11px] text-[var(--color-error)] mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {validationErrors[question.id]}
                  </p>
                )}
              </fieldset>
            </div>
          );
        })}
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm rounded-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">error</span>
          {submitError}
        </div>
      )}

      {/* Submit bar */}
      <div className="mt-4 stagger-in" style={{ animationDelay: `${(questions.length + 2) * 0.1}s` }}>
        <Button
          type="submit"
          size="lg"
          isLoading={formState === "submitting"}
          className="w-full btn-primary bg-[var(--color-primary)] text-[var(--color-on-primary-fixed-variant)] rounded-full py-4 text-sm font-label-caps tracking-wider transition-all"
        >
          {formState === "submitting" ? "Submitting…" : "Submit feedback"}
        </Button>
        <p className="text-xs text-[var(--color-text-secondary)] text-center mt-3">
          Your response is anonymous and will be visible only to CSA members.
        </p>
      </div>
    </form>
  );
}
