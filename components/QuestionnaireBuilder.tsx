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
};

interface BuilderProps {
  eventId: string;
  initialQuestions: Question[];
  isLocked: boolean;
}

interface DraftQuestion {
  id: string; // local uuid before save
  question_text: string;
  question_type: QuestionType;
  options: string[];
  order_index: number;
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
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
        drag_indicator
      </span>
      <input
        type="radio"
        disabled
        className="w-4 h-4 rounded-full border border-white/10 bg-transparent text-[var(--color-primary)] focus:ring-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Option ${index + 1}`}
        style={{
          padding: "20px 24px",
          height: "auto",
          minHeight: "64px",
          textAlign: "center",
          borderRadius: "9999px",
        }}
        className="flex-grow bg-[#050505] border border-white/8 text-[var(--color-text-primary)] font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all placeholder:text-center"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove || disabled}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    const newOptions = newType === "short_text" ? [] : (question.options.length < 2 ? ["", ""] : question.options);
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
      className={`glass-panel bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl rounded-xl pt-6 pb-14 px-6 md:pt-8 md:pb-20 md:px-8 transition-all duration-300 ${isDragging ? "border-[var(--color-primary)]/50 scale-[1.01]" : "hover:border-white/15"}`}
    >
      <div className="flex items-start gap-4">
        {/* Drag handle */}
        <div {...(dragHandleProps ?? {})} className="drag-handle mt-1 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)] hover:text-white transition-colors ml-2">
          <span className="material-symbols-outlined select-none text-[22px]">
            drag_indicator
          </span>
        </div>

        <div className="flex-grow flex flex-col gap-3">
          {/* Card Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
            <div className={`flex items-center gap-3 w-full sm:w-auto relative ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
              <span className="bg-white/5 border border-white/10 text-[var(--color-text-primary)] font-semibold px-3 py-1.5 rounded text-[11px] tracking-wider uppercase">
                Q{index + 1}
              </span>
              
              <div className="relative w-full sm:w-60" ref={dropdownRef}>
                <div 
                  className={`w-full bg-[#050505] border text-[var(--color-text-primary)] rounded-full pl-10 pr-10 font-body-sm text-sm cursor-pointer transition-all relative flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed border-white/5' : 'border-white/8 hover:border-[var(--color-primary)]/50'}`}
                  style={{
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    height: "auto",
                    minHeight: "64px",
                  }}
                  onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="font-medium text-center">{QUESTION_TYPE_LABELS[question.question_type]}</span>
                  <span className={`material-symbols-outlined text-[var(--color-text-secondary)] absolute right-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
                
                {isDropdownOpen && !disabled && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50">
                    <Card padding="sm" style={{ padding: "8px", background: "#0a0a0a", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                      <div className="flex flex-col gap-1">
                        {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                          <div
                            key={type}
                            className={`px-4 py-3 rounded cursor-pointer font-body-sm text-sm transition-colors flex items-center justify-between ${question.question_type === type ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-primary)] hover:bg-white/5'}`}
                            onClick={() => {
                              changeQuestionType(type);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {QUESTION_TYPE_LABELS[type]}
                            {question.question_type === type && <span className="material-symbols-outlined text-[16px]">check</span>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              style={{ marginRight: "120px" }}
              className="text-[var(--color-error)] hover:text-red-400 p-2 hover:bg-white/5 rounded-full transition-all duration-200 disabled:opacity-40"
              aria-label="Delete question"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>

          <div className="max-w-[540px] w-[92%] sm:w-full flex flex-col gap-4">
            <div>
              <label className="block font-label-caps text-label-caps text-[var(--color-text-secondary)] mb-2.5">
                Question Text
              </label>
              <input
                type="text"
                value={question.question_text}
                onChange={(e) =>
                  onChange({ ...question, question_text: e.target.value })
                }
                disabled={disabled}
                placeholder="Type your question here"
                style={{
                  padding: "20px 24px",
                  height: "auto",
                  minHeight: "64px",
                  textAlign: "center",
                  borderRadius: "9999px",
                }}
                className="w-full bg-[#050505] border border-white/8 text-[var(--color-text-primary)] font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all placeholder:text-center"
              />
            </div>

            {/* Options list */}
            {hasOptions && (
              <div className="flex flex-col gap-3">
                <label className="block font-label-caps text-label-caps text-[var(--color-text-secondary)] mb-1">
                  Options
                </label>
                <div className="flex flex-col gap-3">
                  {question.options.map((opt, i) => (
                    <OptionRow
                      key={i}
                      index={i}
                      value={opt}
                      onChange={(v) => updateOption(i, v)}
                      onRemove={() => removeOption(i)}
                      canRemove={question.options.length > 2}
                      disabled={disabled}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  disabled={disabled}
                  style={{ marginTop: "-6px" }}
                  className="self-start text-[var(--color-primary)] font-label-caps text-label-caps flex items-center gap-2 hover:text-[var(--color-primary-fixed)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Add option
                </button>
              </div>
            )}

            {question.question_type === "short_text" && (
              <div className="mt-2" style={{ padding: "16px 0" }}>
                <input
                  type="text"
                  disabled
                  placeholder="Participant will type short answer here..."
                  className="w-full bg-transparent border-b border-white/10 pb-3 font-body-sm text-sm text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main builder ──────────────────────────────────────────────

export function QuestionnaireBuilder({
  eventId,
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
    }))
  );

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = React.useState("");

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateLocalId(),
        question_text: "",
        question_type: "single_choice",
        options: ["", ""],
        order_index: prev.length,
      },
    ]);
  }

  function updateQuestion(id: string, updated: DraftQuestion) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? updated : q))
    );
  }

  function removeQuestion(id: string) {
    setQuestions((prev) =>
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
    setQuestions(reordered.map((q, i) => ({ ...q, order_index: i })));
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
        event_id: eventId,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options:
          q.question_type === "short_text" ? null : q.options.map((o) => o.trim()),
        order_index: i,
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

  if (isLocked) {
    return (
      <Card padding="md" style={{ borderLeft: "4px solid var(--color-tertiary)", marginBottom: "24px" }}>
        <div className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined text-[var(--color-tertiary)] flex-shrink-0 mt-0.5">
            warning
          </span>
          <div>
            <strong className="text-[var(--color-text-primary)] font-semibold">Questionnaire locked.</strong>{" "}
            This event already has responses. The questionnaire cannot be edited to preserve data integrity.
            <div className="mt-3">
              <Link
                href={`/events/${eventId}`}
                className="text-[var(--color-primary)] hover:underline"
              >
                Back to event hub
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="animate-fade-slide-up">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-24 bg-black/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)] font-body-sm px-1">
              {questions.length} question{questions.length !== 1 ? "s" : ""} configured
            </span>
            {saveStatus === "saved" && (
              <span className="text-[var(--color-secondary)] text-sm font-semibold flex items-center gap-1.5 animate-fade-in">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Saved successfully
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-[var(--color-error)] text-sm font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span> Error saving
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={addQuestion}
              disabled={isSaving}
              variant="secondary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
              className="w-full sm:w-auto"
            >
              Add question
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || questions.length === 0}
              variant="secondary-light"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
              className="w-full sm:w-auto"
            >
              Save questionnaire
            </Button>
          </div>
        </div>

        {/* Validation error */}
        {saveError && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/25 text-[var(--color-error)] text-sm rounded-lg mb-8 flex items-center gap-2"
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
                className="flex flex-col gap-6 mb-6"
              >
              {questions.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg text-[var(--color-text-secondary)] bg-black/20">
                  No questions yet. Add your first question above.
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
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </div>
    </div>
  );
}

