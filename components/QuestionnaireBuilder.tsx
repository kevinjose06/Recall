"use client";

import * as React from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd";
import { saveQuestions } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Question, QuestionType } from "@/lib/types";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single choice",
  mcq: "Multiple choice",
  short_text: "Short text",
  star_rating: "Star rating",
};

const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  single_choice: "radio_button_checked",
  mcq: "check_box",
  short_text: "short_text",
  star_rating: "star",
};

interface BuilderProps {
  eventId: string;
  eventTitle: string;
  initialQuestions: Question[];
  isLocked: boolean;
}

interface DraftQuestion {
  id: string; // local uuid before save
  question_text: string;
  question_type: QuestionType;
  options: string[];
  order_index: number;
  is_required: boolean;
  saved_id?: string; // Supabase id after save
}

function generateLocalId() {
  return `local-${Math.random().toString(36).slice(2)}`;
}

// ─── Option row ────────────────────────────────────────────────

function OptionRow({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  disabled,
  isMultipleChoice,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
  isMultipleChoice: boolean;
}) {
  return (
    <div className="flex items-center gap-3 w-full group">
      <span className="material-symbols-outlined text-white/20 text-[18px] opacity-0 group-hover:opacity-100 transition-opacity select-none">
        drag_indicator
      </span>
      <div
        className={`w-4 h-4 border bg-transparent shrink-0 transition-all duration-150 ${
          isMultipleChoice 
            ? "rounded-[4px] border-white/30" 
            : "rounded-full border-white/30"
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Option ${index + 1}`}
        className="flex-grow max-w-[75%] bg-transparent border-b border-transparent hover:border-white/10 text-[var(--color-text-primary)] font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all py-[10px] px-[14px] min-h-[40px] placeholder:text-white/30"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove || disabled}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

// ─── Question card ─────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onRemove,
  draggableProps,
  dragHandleProps,
  innerRef,
  isDragging,
  disabled,
}: {
  question: DraftQuestion;
  index: number;
  total: number;
  onChange: (updated: DraftQuestion) => void;
  onRemove: () => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  innerRef: (el: HTMLElement | null) => void;
  isDragging: boolean;
  disabled: boolean;
}) {
  const hasOptions =
    question.question_type === "single_choice" ||
    question.question_type === "mcq";

  const isMultipleChoice = question.question_type === "mcq";

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeQuestionType(newType: QuestionType) {
    if (newType === question.question_type) return;
    const newOptions =
      newType === "short_text" || newType === "star_rating"
        ? []
        : question.options.length < 2
        ? ["", ""]
        : question.options;
    onChange({ ...question, question_type: newType, options: newOptions as string[] });
  }

  function addOption() {
    onChange({ ...question, options: [...question.options, ""] });
  }

  // Ensure default radio options are initialized properly
  React.useEffect(() => {
    if (hasOptions && question.options.length < 2) {
      onChange({ ...question, options: ["", ""] });
    }
  }, [hasOptions, question, onChange]);

  function updateOption(i: number, value: string) {
    const newOptions = [...question.options];
    newOptions[i] = value;
    onChange({ ...question, options: newOptions });
  }

  function removeOption(i: number) {
    onChange({
      ...question,
      options: question.options.filter((_, idx) => idx !== i),
    });
  }

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={`relative bg-[#0f0f0f] border border-white/10 rounded-xl transition-all duration-300 max-w-3xl mx-auto w-full ${
        isDragging ? "border-[var(--color-primary)]/50 shadow-2xl scale-[1.01] z-50" : "shadow-md hover:border-white/20"
      }`}
    >
      <style>{`
        @keyframes dropdownReveal {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .premium-dropdown {
          animation: dropdownReveal 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: rgba(18, 18, 20, 0.95);
          backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 12px 40px -8px rgba(0, 0, 0, 0.7),
            0 0 20px 2px rgba(123, 164, 255, 0.04);
        }
        .premium-item {
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-item:hover {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
          transform: translateX(3px);
        }
        .premium-item-active {
          background: linear-gradient(90deg, rgba(123, 164, 255, 0.12) 0%, rgba(123, 164, 255, 0.02) 100%) !important;
          border-left: 2px solid var(--color-primary);
          border-top-left-radius: 0 !important;
          border-bottom-left-radius: 0 !important;
        }
        .premium-btn {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-btn:hover {
          background: rgba(36, 36, 40, 0.9) !important;
          border-color: rgba(123, 164, 255, 0.35) !important;
          box-shadow: 0 0 15px 0 rgba(123, 164, 255, 0.08) !important;
        }
        .premium-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .premium-item:hover .premium-icon-box {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Premium Card Content Spacing */
        .premium-card-content {
          padding: 20px 24px 48px 24px;
        }
        
        /* Mobile and Desktop responsive overrides */
        @media (max-width: 767px) {
          .premium-card-content {
            padding: 16px 16px 36px 16px !important;
          }
          .mobile-input-offset {
            margin-left: 16px !important;
            width: calc(100% - 32px) !important;
          }
          .mobile-short-text-offset {
            margin-left: 16px !important;
          }
          .mobile-right-controls-offset {
            margin-right: 0px !important;
          }
        }
        
        @media (min-width: 768px) {
          .desktop-input-offset {
            margin-left: 64px !important;
            width: calc(100% - 128px) !important;
          }
          .desktop-short-text-offset {
            margin-left: 64px !important;
          }
          .desktop-right-controls-offset {
            margin-right: 64px !important;
          }
        }
      `}</style>
      {/* Drag handle block at the top */}
      <div 
        {...(dragHandleProps ?? {})}
        className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing rounded-t-xl hover:bg-white/5 transition-colors"
        title="Drag to reorder"
      >
        <span className="material-symbols-outlined text-[18px] text-white/20 select-none">
          drag_indicator
        </span>
      </div>

      <div className="flex flex-col gap-6 premium-card-content">
        {/* Top Row: Question Input */}
        <div className="w-full">
          <input
            type="text"
            value={question.question_text}
            onChange={(e) => onChange({ ...question, question_text: e.target.value })}
            disabled={disabled}
            placeholder="Question title"
            className="bg-[#1a1a1a] border-b-2 border-white/10 hover:border-white/30 text-[var(--color-text-primary)] font-body-lg text-lg focus:outline-none focus:border-[var(--color-primary)] transition-all rounded-t-md placeholder:text-white/30 mobile-input-offset desktop-input-offset"
            style={{ 
              padding: '12px 16px', 
              minHeight: '56px',
            }}
          />
        </div>

        {/* Second Row: Options and Right Controls */}
        <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-start w-full mt-2 relative gap-6 md:gap-0">
          
          {/* Options Area */}
          <div className="pl-1 w-full md:max-w-[60%]">
            {hasOptions && (
              <div className="flex flex-col gap-[14px]">
                {question.options.map((opt, i) => (
                  <OptionRow
                    key={i}
                    index={i}
                    value={opt}
                    onChange={(v) => updateOption(i, v)}
                    onRemove={() => removeOption(i)}
                    canRemove={question.options.length > 2}
                    disabled={disabled}
                    isMultipleChoice={isMultipleChoice}
                  />
                ))}
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-transparent select-none text-[18px]">drag_indicator</span>
                  <div className={`w-4 h-4 border border-white/20 bg-transparent shrink-0 ${
                    isMultipleChoice ? "rounded-[4px]" : "rounded-full"
                  }`} />
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={disabled}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-2 px-1"
                  >
                    Add option
                  </button>
                </div>
              </div>
            )}

            {question.question_type === "short_text" && (
              <div className="pt-2 pb-4 px-1 mobile-short-text-offset desktop-short-text-offset">
                <input
                  type="text"
                  disabled
                  placeholder="Short answer text"
                  className="w-full bg-transparent border-b border-white/20 pb-2 font-body-sm text-sm text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed outline-none"
                />
              </div>
            )}

            {question.question_type === "star_rating" && (
              <div className="pt-2 pb-4 px-1 mobile-short-text-offset desktop-short-text-offset">
                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <span
                      key={rating}
                      className="material-symbols-outlined text-[28px]"
                      aria-hidden="true"
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls Column */}
          <div className="flex flex-col items-stretch md:items-end gap-5 flex-shrink-0 w-full md:w-auto md:ml-4 animate-fade-in mobile-right-controls-offset desktop-right-controls-offset">
            {/* Question Type Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className={`flex items-center justify-between gap-4 rounded-lg cursor-pointer select-none premium-btn w-full md:w-auto ${
                  disabled ? 'opacity-50 cursor-not-allowed border-white/5' : ''
                }`}
                style={{ padding: '10px 16px', minWidth: '220px' }}
                onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-3">
                  <div className="premium-icon-box" style={{ background: 'rgba(123, 164, 255, 0.1)', borderColor: 'rgba(123, 164, 255, 0.2)' }}>
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">
                      {QUESTION_TYPE_ICONS[question.question_type]}
                    </span>
                  </div>
                  <span className="font-body-sm text-base font-medium whitespace-nowrap text-white">{QUESTION_TYPE_LABELS[question.question_type]}</span>
                </div>
                <span className={`material-symbols-outlined text-[var(--color-text-secondary)] text-[22px] transition-transform duration-250 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}>
                  expand_more
                </span>
              </div>
              
              {isDropdownOpen && !disabled && (
                <div className="absolute top-[calc(100%+6px)] right-0 w-full min-w-[220px] z-50 premium-dropdown p-1.5 flex flex-col gap-0.5 rounded-xl origin-top">
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => {
                    const isActive = question.question_type === type;
                    return (
                      <div
                        key={type}
                        className={`px-3 py-2.5 cursor-pointer font-body-sm text-sm rounded-lg flex items-center justify-between group/item premium-item ${
                          isActive 
                            ? 'premium-item-active text-[var(--color-primary)] font-semibold' 
                            : 'text-[var(--color-text-secondary)] hover:text-white'
                        }`}
                        onClick={() => {
                          changeQuestionType(type);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`premium-icon-box transition-all ${
                            isActive 
                              ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/20 text-[var(--color-primary)]' 
                              : 'text-white/40 group-hover/item:text-white/80'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {QUESTION_TYPE_ICONS[type]}
                            </span>
                          </div>
                          <span>{QUESTION_TYPE_LABELS[type]}</span>
                        </div>
                        {isActive && (
                          <span className="material-symbols-outlined text-[var(--color-primary)] text-[18px] mr-1">check</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer actions: Duplicate, Delete, Required Toggle */}
            <div className="flex items-center justify-end gap-6 relative" style={{ zIndex: 10 }}>
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors disabled:opacity-40"
                aria-label="Delete question"
                title="Delete question"
              >
                <span className="material-symbols-outlined text-[22px]">delete</span>
              </button>
              
              <div className="w-px h-6 bg-white/10"></div>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className="font-body-sm text-sm text-[var(--color-text-primary)] group-hover:text-white transition-colors">Required</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={question.is_required}
                    onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${question.is_required ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${question.is_required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main builder ──────────────────────────────────────────────

export function QuestionnaireBuilder({
  eventId,
  eventTitle,
  initialQuestions,
  isLocked,
}: BuilderProps) {
  const [questions, setQuestions] = React.useState<DraftQuestion[]>(() =>
    initialQuestions.map((q) => ({
      id: q.id,
      saved_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: (q.options as string[]) ?? [],
      order_index: q.order_index,
      is_required: q.is_required ?? false,
    }))
  );

  const [history, setHistory] = React.useState<{ past: DraftQuestion[][]; future: DraftQuestion[][] }>({
    past: [],
    future: [],
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = React.useState("");

  function setQuestionsWithHistory(newQuestions: DraftQuestion[] | ((prev: DraftQuestion[]) => DraftQuestion[])) {
    setQuestions((prev) => {
      const next = typeof newQuestions === "function" ? newQuestions(prev) : newQuestions;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setHistory((h) => ({
          past: [...h.past, prev],
          future: [],
        }));
      }
      return next;
    });
  }

  function undo() {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    setHistory({ past: newPast, future: [questions, ...history.future] });
    setQuestions(previous);
  }

  function redo() {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    setHistory({ past: [...history.past, questions], future: newFuture });
    setQuestions(next);
  }

  function addQuestion() {
    setQuestionsWithHistory((prev) => [
      ...prev,
      {
        id: generateLocalId(),
        question_text: "",
        question_type: "single_choice",
        options: ["", ""],
        order_index: prev.length,
        is_required: false,
      },
    ]);
  }

  function updateQuestion(id: string, updated: DraftQuestion) {
    setQuestionsWithHistory((prev) =>
      prev.map((q) => (q.id === id ? updated : q))
    );
  }

  function removeQuestion(id: string) {
    setQuestionsWithHistory((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, i) => ({ ...q, order_index: i }))
    );
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = Array.from(questions);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setQuestionsWithHistory(reordered.map((q, i) => ({ ...q, order_index: i })));
  }

  function validate(): string | null {
    if (questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim())
        return `Question ${i + 1} needs a question text.`;
      if (
        (q.question_type === "single_choice" || q.question_type === "mcq") &&
        q.options.length < 2
      )
        return `Question ${i + 1} needs at least 2 options.`;
      if (
        (q.question_type === "single_choice" || q.question_type === "mcq") &&
        q.options.some((o) => !o.trim())
      )
        return `All options in question ${i + 1} must have text.`;
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setSaveError(err);
      return;
    }
    setSaveError("");
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const rows = questions.map((q, i) => ({
        id: q.saved_id,
        event_id: eventId,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options:
          q.question_type === "short_text" || q.question_type === "star_rating"
            ? null
            : q.options.map((o) => o.trim()),
        order_index: i,
        is_required: q.is_required,
      }));

      const newIds = await saveQuestions(eventId, rows);

      setQuestions((prev) =>
        prev.map((q, i) => ({
          ...q,
          saved_id: newIds[i] ?? q.saved_id,
        }))
      );

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <style>{`
        /* Responsive controls bar overrides for mobile only */
        @media (max-width: 767px) {
          .responsive-navbar {
            top: 12px !important;
            width: 92% !important;
            max-width: 400px !important;
            height: 56px !important;
            min-height: 56px !important;
            padding: 0 20px !important;
            gap: 16px !important;
            justify-content: space-between !important;
          }
          .responsive-navbar-options {
            gap: 16px !important;
          }
          .responsive-navbar-count {
            font-size: 0.9rem !important;
          }
          .responsive-navbar-divider {
            padding-right: 12px !important;
            margin-right: 4px !important;
          }
          .responsive-button-text {
            display: none !important;
          }
          .responsive-button-padding {
            padding: 0 12px !important;
            height: 38px !important;
          }
        }
      `}</style>

      {/* Fixed Navbar Controls */}
      <div 
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center gap-8 bg-[#141414]/95 border border-white/10 rounded-full backdrop-blur-md shadow-2xl w-max responsive-navbar"
        style={{ minHeight: '72px', padding: '0 48px' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[1.05rem] font-semibold text-white tracking-wide responsive-navbar-count">
            {questions.length} <span className="responsive-button-text">Question{questions.length !== 1 ? "s" : ""}</span><span className="md:hidden">Q{questions.length !== 1 ? "s" : ""}</span>
          </span>
          {saveStatus === "saved" && (
            <span className="text-[var(--color-secondary)] text-[1.05rem] font-semibold flex items-center gap-1.5 animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> <span className="responsive-button-text">Saved</span>
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-[var(--color-error)] text-[1.05rem] font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">error</span> <span className="responsive-button-text">Error</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 responsive-navbar-options">
          {/* Undo / Redo controls */}
          <div className="flex items-center gap-1 pr-4 border-r border-white/10 responsive-navbar-divider">
            <button
              type="button"
              onClick={undo}
              disabled={history.past.length === 0 || isSaving}
              className="text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 rounded-full p-2 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Undo"
            >
              <span className="material-symbols-outlined text-[24px] block">undo</span>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={history.future.length === 0 || isSaving}
              className="text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 rounded-full p-2 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Redo"
            >
              <span className="material-symbols-outlined text-[24px] block">redo</span>
            </button>
          </div>

          <Link href={`/respond/${eventId}`} target="_blank">
            <Button
              variant="primary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[20px]">visibility</span>}
              className="responsive-button-padding"
            >
              <span className="responsive-button-text">Preview</span>
            </Button>
          </Link>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || questions.length === 0}
            variant="secondary-light"
            size="md"
            leftIcon={<span className="material-symbols-outlined text-[20px]">save</span>}
            className="responsive-button-padding"
          >
            <span className="responsive-button-text">Save</span>
          </Button>
        </div>
      </div>

      <div className="animate-fade-slide-up pt-32">
        {/* Banner Section with Breadcrumb */}
        <Card padding="lg" className="max-w-4xl mx-auto w-full" style={{ marginBottom: '24px' }}>
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-label-caps text-label-caps mb-4">
            <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
              Events
            </Link>
            <span className="material-symbols-outlined text-[16px] select-none">chevron_right</span>
            <Link href={`/events/${eventId}`} className="hover:text-[var(--color-primary)] transition-colors">
              {eventTitle}
            </Link>
            <span className="material-symbols-outlined text-[16px] select-none">chevron_right</span>
            <span className="text-[var(--color-text-primary)]">Builder</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
            Questionnaire builder
          </h1>
          <ul className="list-disc pl-5 m-0 text-white/90 text-[0.9375rem] font-medium tracking-wide">
            <li>Drag cards by the top handle to reorder questions</li>
          </ul>
        </Card>

        {/* Validation error */}
        {saveError && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/25 text-[var(--color-error)] text-sm rounded-lg mb-8 flex items-center gap-2 max-w-3xl mx-auto w-full"
          >
            <span className="material-symbols-outlined text-lg">error</span>
            {saveError}
          </div>
        )}

        {/* Questions list */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col items-center gap-6 mb-12 w-full"
              >
              {questions.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg text-[var(--color-text-secondary)] bg-black/20 max-w-3xl mx-auto w-full mb-6">
                  No questions yet. Add your first question below.
                </div>
              )}

              {questions.map((q, i) => (
                <Draggable key={q.id} draggableId={q.id} index={i}>
                  {(provided, snapshot) => (
                    <QuestionCard
                      question={q}
                      index={i}
                      total={questions.length}
                      onChange={(updated) => updateQuestion(q.id, updated)}
                      onRemove={() => removeQuestion(q.id)}
                      draggableProps={provided.draggableProps}
                      dragHandleProps={provided.dragHandleProps}
                      innerRef={provided.innerRef}
                      isDragging={snapshot.isDragging}
                      disabled={isSaving}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <div className="flex justify-center mt-8">
                <Button
                  onClick={addQuestion}
                  disabled={isSaving}
                  variant="secondary-light"
                  size="lg"
                  leftIcon={<span className="material-symbols-outlined text-[24px]">add</span>}
                  className="rounded-full shadow-lg"
                >
                  Add question
                </Button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </div>
    </div>
  );
}
