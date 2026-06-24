"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { getQuestionnaireSignature } from "@/lib/questionnaire-signature";
import type { AnswerValue, Question } from "@/lib/types";

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

const RESPONDENT_KEY_PREFIX = "recall_respondent_";
const SUBMISSION_KEY_PREFIX = "recall_submission_";

type FormState = "idle" | "submitting" | "success" | "already_submitted" | "error";

function getLocalStorageItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // If storage is unavailable, the server-side duplicate guard still applies.
  }
}

function getOrCreateRespondentToken(eventId: string) {
  const storageKey = `${RESPONDENT_KEY_PREFIX}${eventId}`;
  const existing = getLocalStorageItem(storageKey);

  if (existing) {
    return existing;
  }

  const token = generateUUID();
  setLocalStorageItem(storageKey, token);
  return token;
}

function useLocalStorageValue(key: string) {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {};

      function handleStorage(event: StorageEvent) {
        if (event.key === key || event.key === null) {
          onStoreChange();
        }
      }

      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [key]
  );

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") return null;
    return getLocalStorageItem(key);
  }, [key]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => null);
}

function hasAnswerValue(value: AnswerValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return value >= 1 && value <= 5;
  if (typeof value === "string") return value.trim() !== "";
  return false;
}

export function ParticipantForm({
  eventId,
  eventTitle,
  questions,
}: ParticipantFormProps) {
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState("");
  const questionnaireSignature = React.useMemo(
    () => getQuestionnaireSignature(questions),
    [questions]
  );
  const submissionStorageKey = `${SUBMISSION_KEY_PREFIX}${eventId}_${questionnaireSignature}`;
  const submittedCurrentQuestionnaire = useLocalStorageValue(submissionStorageKey);

  function setSingleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  }

  function setRatingAnswer(questionId: string, value: number) {
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

  function clearForm() {
    if (confirm("Are you sure you want to clear all your answers?")) {
      setAnswers({});
      setValidationErrors({});
      setSubmitError("");
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
        } else if (q.question_type === "star_rating") {
          if (typeof answer !== "number" || answer < 1 || answer > 5) {
            errors[q.id] = "Please select a rating.";
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

    const respondentToken = getOrCreateRespondentToken(eventId);

    const payloadAnswers = questions
      .map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id],
      }))
      .filter((answer): answer is { question_id: string; answer_value: AnswerValue } =>
        hasAnswerValue(answer.answer_value)
      );

    const payload = {
      event_id: eventId,
      respondent_token: respondentToken,
      questionnaire_signature: questionnaireSignature,
      answers: payloadAnswers,
    };

    try {
      const res = await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body.code === "ALREADY_SUBMITTED") {
          setLocalStorageItem(submissionStorageKey, respondentToken);
          setFormState("already_submitted");
          return;
        }
        throw new Error(body.error ?? "Submission failed");
      }

      setLocalStorageItem(submissionStorageKey, respondentToken);
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
  if (formState === "already_submitted" || (formState === "idle" && submittedCurrentQuestionnaire)) {
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 w-full items-center">
      <style>{`
        /* Mobile and Desktop responsive overrides */
        @media (max-width: 767px) {
          .premium-card-content {
            padding: 16px 16px 36px 16px !important;
          }
          .mobile-input-offset {
            margin-left: 16px !important;
            width: calc(100% - 32px) !important;
          }
        }
        
        @media (min-width: 768px) {
          .premium-card-content {
            padding: 20px 24px 48px 24px;
          }
          .desktop-input-offset {
            margin-left: 64px !important;
            width: calc(100% - 128px) !important;
          }
        }
      `}</style>
      <div className="flex flex-col gap-6 w-full items-center">
        {questions.map((question, idx) => {
          const hasError = !!validationErrors[question.id];
          const delayStyle = { animationDelay: `${(idx + 2) * 0.1}s` };

          return (
            <div
              key={question.id}
              id={`question-${question.id}`}
              style={{
                ...delayStyle,
                background: "#0f0f0f",
                borderColor: hasError ? "rgba(255, 180, 171, 0.3)" : "rgba(255, 255, 255, 0.1)",
              }}
              className={`relative border rounded-xl stagger-in transition-all duration-300 max-w-3xl mx-auto w-[calc(100%-32px)] md:w-full ${
                hasError
                  ? "shadow-[0_0_15px_rgba(255,180,171,0.05)]"
                  : "hover:border-white/20 focus-within:border-[var(--color-primary)]/20 focus-within:shadow-[0_0_15px_rgba(174,198,255,0.1)]"
              }`}
            >
              {/* Decorative drag handle block at the top */}
              <div className="w-full flex justify-center py-2 select-none opacity-40">
                <span className="material-symbols-outlined text-[18px] text-white/30">
                  drag_indicator
                </span>
              </div>

              <div className="flex flex-col gap-6 premium-card-content">
                {/* Title Area matching builder input field style */}
                <div className="mobile-input-offset desktop-input-offset">
                  <div
                    className="bg-[#1a1a1a] border-b-2 border-white/10 text-[var(--color-text-primary)] font-medium text-[16px] md:text-[18px] rounded-t-md flex items-center justify-between"
                    style={{
                      padding: "12px 16px",
                      minHeight: "56px",
                      width: "100%",
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="label-caps text-[10px] text-[var(--color-text-secondary)] tracking-wider">
                        Q{idx + 1} ·{" "}
                        {question.question_type === "single_choice"
                          ? "Choose one"
                          : question.question_type === "mcq"
                          ? "Choose all that apply"
                          : question.question_type === "star_rating"
                          ? "Rate from 1 to 5"
                          : "Short answer"}
                      </span>
                      <span>{question.question_text}</span>
                    </div>
                    {question.is_required && (
                      <span className="text-[var(--color-error)] text-lg font-semibold ml-2">*</span>
                    )}
                  </div>
                </div>
 
                {/* Options Area matching builder options row */}
                <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-start w-full mt-4 relative mobile-input-offset desktop-input-offset">
                  <div className="pl-8 md:pl-[35%] w-full flex flex-col gap-[16px]">
                    {/* Single choice — custom radios */}
                    {question.question_type === "single_choice" &&
                      (question.options ?? []).map((option) => {
                        const isChecked = answers[question.id] === option;
                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-4 w-full group cursor-pointer`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isChecked}
                              onChange={() => setSingleAnswer(question.id, option)}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 border bg-transparent shrink-0 transition-all duration-150 rounded-full flex items-center justify-center ${
                              isChecked ? "border-[var(--color-primary)]" : "border-white/30 group-hover:border-white/50"
                            }`}>
                              {isChecked && (
                                <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-primary)]"></div>
                              )}
                            </div>
                            <div className={`flex-grow bg-transparent border-b border-transparent py-[10px] px-[14px] min-h-[48px] text-base transition-all duration-150 flex items-center ${
                              isChecked ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text-primary)] group-hover:border-white/10"
                            }`}>
                              {option}
                            </div>
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
                            className={`flex items-center gap-4 w-full group cursor-pointer`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMultiAnswer(question.id, option)}
                              className="sr-only"
                            />
                            <div className={`w-6 h-6 border shrink-0 transition-all duration-150 rounded-[4px] flex items-center justify-center bg-transparent ${
                              isChecked ? "border-[var(--color-primary)]" : "border-white/30 group-hover:border-white/50"
                            }`}>
                              {isChecked && (
                                <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)] font-bold">check</span>
                              )}
                            </div>
                            <div className={`flex-grow bg-transparent border-b border-transparent py-[10px] px-[14px] min-h-[48px] text-base transition-all duration-150 flex items-center ${
                              isChecked ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-text-primary)] group-hover:border-white/10"
                            }`}>
                              {option}
                            </div>
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

                    {question.question_type === "star_rating" && (
                      <div className="flex flex-nowrap items-center gap-2" role="radiogroup" aria-label={question.question_text}>
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const selectedRating =
                            typeof answers[question.id] === "number"
                              ? (answers[question.id] as number)
                              : 0;
                          const isSelected = selectedRating === rating;
                          const isFilled = selectedRating >= rating;

                          return (
                            <button
                              key={rating}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                              onClick={() => setRatingAnswer(question.id, rating)}
                              className={`h-11 w-11 rounded-lg border transition-all flex items-center justify-center ${
                                isFilled
                                  ? "border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                  : "border-white/10 bg-white/[0.03] text-white/30 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25"
                              }`}
                            >
                              <span
                                className="material-symbols-outlined text-[28px]"
                                style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Validation error text */}
                    {hasError && (
                      <p className="text-[11px] text-[var(--color-error)] mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {validationErrors[question.id]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm rounded-lg flex items-center gap-2 max-w-3xl mx-auto w-[calc(100%-32px)] md:w-full"
        >
          <span className="material-symbols-outlined text-lg">error</span>
          {submitError}
        </div>
      )}

      {/* Submit bar */}
      <div className="mt-2 stagger-in max-w-3xl mx-auto w-[calc(100%-32px)] md:w-full flex justify-between items-center gap-4 mb-6" style={{ animationDelay: `${(questions.length + 2) * 0.1}s` }}>
        <Button
          type="button"
          onClick={clearForm}
          variant="primary"
          size="md"
          className="max-w-[140px]"
        >
          Clear form
        </Button>
        <Button
          type="submit"
          variant="secondary-light"
          size="md"
          isLoading={formState === "submitting"}
          className="w-full max-w-[200px] md:max-w-[320px] tracking-wider"
        >
          {formState === "submitting" ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>

      {/* Dedicated vacant space below the buttons */}
      <div className="h-32 w-full shrink-0" aria-hidden="true" />
    </form>
  );
}
