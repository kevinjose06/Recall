"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { QuestionType } from "@/lib/types";

interface AIGeneratedQuestion {
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  is_required: boolean;
}

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Omit<AIGeneratedQuestion, "id">[]) => void;
}

const EXAMPLE_PROMPTS = [
  "A 2-day technical bootcamp covering Next.js, Server Actions, and Tailwind CSS, ending with a hackathon.",
  "An annual corporate summer retreat with team-building activities, dinner, and a closing awards ceremony.",
  "An academic workshop on AI Agent Design, including research paper presentations and a panel discussion.",
];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  mcq: "Multiple Choice",
  short_text: "Short Answer",
  star_rating: "Star Rating",
};

const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  single_choice: "radio_button_checked",
  mcq: "check_box",
  short_text: "short_text",
  star_rating: "star",
};

export function AIGeneratorModal({ isOpen, onClose, onAddQuestions }: AIGeneratorModalProps) {
  const [description, setDescription] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<AIGeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate questions. Please try again.");
      }

      const data = await res.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response format from generator.");
      }

      setSuggestions(data.questions);
      setSelectedIndices(new Set(data.questions.map((_: any, i: number) => i)));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleSelect(index: number) {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  }

  function handleQuestionTextChange(index: number, text: string) {
    setSuggestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, question_text: text } : q))
    );
  }

  function handleAddSelected() {
    const selected = suggestions.filter((_, idx) => selectedIndices.has(idx));
    onAddQuestions(selected);
    onClose();
  }

  function handleAddAll() {
    onAddQuestions(suggestions);
    onClose();
  }

  function resetState() {
    setDescription("");
    setSuggestions([]);
    setSelectedIndices(new Set());
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300"
        onClick={() => { if (!isGenerating) onClose(); }}
      />

      {/* Modal Content */}
      <div
        className="relative bg-[#0d0d0f] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.85)] overflow-hidden animate-fade-slide-up"
        style={{ maxHeight: "min(90vh, 780px)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: "28px 32px 24px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-4">
            {/* Icon box */}
            <div
              className="flex items-center justify-center rounded-2xl text-purple-400 shrink-0"
              style={{
                width: 52,
                height: 52,
                background: "rgba(168, 85, 247, 0.12)",
                border: "1px solid rgba(168, 85, 247, 0.25)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>auto_awesome</span>
            </div>
            <div className="flex flex-col gap-1">
              <h2
                className="text-white font-semibold tracking-wide"
                style={{ fontSize: "1.2rem", lineHeight: 1.3 }}
              >
                Generate Questionnaire with AI
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>
                Describe your event to get tailored questions instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-white/30 hover:text-white transition-colors hover:bg-white/5 rounded-full shrink-0"
            style={{ padding: 8 }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "28px 32px" }}>
          {suggestions.length === 0 ? (
            /* Input Step */
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Textarea section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label
                  className="font-semibold uppercase tracking-widest"
                  style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}
                >
                  Event Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isGenerating}
                  placeholder="Provide details about the event — what is it about? Who are the attendees? What key topics will be covered? What feedback goals do you have?"
                  className="focus:outline-none transition-all resize-none text-white placeholder:text-white/25"
                  style={{
                    height: 148,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 14,
                    padding: "16px 18px",
                    fontSize: "0.9rem",
                    lineHeight: 1.65,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.45)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                />
              </div>

              {/* Example Prompts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span
                  className="font-semibold uppercase tracking-widest block"
                  style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em" }}
                >
                  Example Prompt Suggestions
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setDescription(prompt)}
                      className="text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: "13px 16px",
                        fontSize: "0.8375rem",
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.55,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.045)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)";
                      }}
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div
                  className="flex items-start gap-3"
                  style={{
                    padding: "16px 18px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 12,
                    color: "rgba(252, 165, 165, 1)",
                  }}
                >
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18, marginTop: 1 }}>error</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span className="font-semibold text-sm">Generation Failed</span>
                    <p style={{ fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.5 }}>{error}</p>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isGenerating && (
                <div
                  className="flex flex-col items-center justify-center animate-pulse"
                  style={{ paddingTop: 24, paddingBottom: 16, gap: 20 }}
                >
                  <div className="relative flex items-center justify-center">
                    <div
                      className="absolute rounded-full bg-purple-500/20 blur-2xl animate-pulse"
                      style={{ inset: -12 }}
                    />
                    <Spinner size={40} />
                  </div>
                  <div className="text-center" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p className="font-semibold text-white" style={{ fontSize: "0.95rem" }}>
                      Analyzing event details...
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.38)" }}>
                      Gemini is designing optimal feedback questions
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results Step */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold uppercase tracking-widest"
                  style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}
                >
                  Suggested Questions ({selectedIndices.size} selected)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIndices.size === suggestions.length) {
                      setSelectedIndices(new Set());
                    } else {
                      setSelectedIndices(new Set(suggestions.map((_, i) => i)));
                    }
                  }}
                  className="transition-colors"
                  style={{ fontSize: "0.8125rem", color: "rgba(192, 132, 252, 1)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(216, 180, 254, 1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(192, 132, 252, 1)"; }}
                >
                  {selectedIndices.size === suggestions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {suggestions.map((q, i) => {
                  const isChecked = selectedIndices.has(i);
                  return (
                    <div
                      key={i}
                      className="flex items-start transition-all"
                      style={{
                        gap: 16,
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: `1px solid ${isChecked ? "rgba(168, 85, 247, 0.3)" : "rgba(255,255,255,0.06)"}`,
                        background: isChecked ? "rgba(168, 85, 247, 0.04)" : "rgba(255,255,255,0.01)",
                        opacity: isChecked ? 1 : 0.55,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(i)}
                        className="cursor-pointer shrink-0"
                        style={{ width: 16, height: 16, marginTop: 3, accentColor: "#a855f7" }}
                      />
                      <div className="flex-1" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="flex items-center justify-between" style={{ gap: 12 }}>
                          <div
                            className="flex items-center"
                            style={{
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 99,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.45)",
                              fontSize: "0.6875rem",
                              fontWeight: 500,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {QUESTION_TYPE_ICONS[q.question_type]}
                            </span>
                            <span>{QUESTION_TYPE_LABELS[q.question_type]}</span>
                          </div>
                          {q.is_required && (
                            <span
                              className="uppercase font-bold tracking-wider"
                              style={{ fontSize: "0.625rem", color: "rgba(192, 132, 252, 1)" }}
                            >
                              Required
                            </span>
                          )}
                        </div>

                        {/* Editable question text */}
                        <input
                          type="text"
                          value={q.question_text}
                          onChange={(e) => handleQuestionTextChange(i, e.target.value)}
                          className="w-full bg-transparent text-white font-medium focus:outline-none transition-all"
                          style={{
                            borderBottom: "1px solid transparent",
                            paddingBottom: 4,
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.2)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                          placeholder="Question text"
                        />

                        {/* Options preview */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2" style={{ gap: 6 }}>
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="flex items-center"
                                style={{
                                  gap: 8,
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                  fontSize: "0.775rem",
                                  color: "rgba(255,255,255,0.38)",
                                }}
                              >
                                <span
                                  className="rounded-full shrink-0"
                                  style={{ width: 5, height: 5, background: "rgba(255,255,255,0.2)" }}
                                />
                                <span className="truncate">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="shrink-0 flex items-center justify-between"
          style={{
            padding: "20px 32px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(10,10,11,0.8)",
            gap: 12,
          }}
        >
          {suggestions.length === 0 ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                leftIcon={<span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                style={{ backgroundColor: "var(--color-primary)", borderColor: "transparent", color: "#fff" }}
              >
                Generate suggestions
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={resetState}>
                <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
                Start over
              </Button>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Button variant="secondary" onClick={handleAddSelected} disabled={selectedIndices.size === 0}>
                  Add Selected ({selectedIndices.size})
                </Button>
                <Button variant="secondary-light" onClick={handleAddAll}>
                  Add All ({suggestions.length})
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
