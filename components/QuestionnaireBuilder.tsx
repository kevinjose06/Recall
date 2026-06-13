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
        className="flex-grow bg-[#050505] border border-white/8 text-[var(--color-text-primary)] rounded px-3 py-2 font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all"
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
  onChange,
  onRemove,
  draggableProps,
  dragHandleProps,
  innerRef,
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
      className="glass-panel rounded-lg p-6 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Drag handle */}
        <div {...(dragHandleProps ?? {})} className="drag-handle mt-2">
          <span className="material-symbols-outlined select-none text-[20px]">
            drag_indicator
          </span>
        </div>

        <div className="flex-grow flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps text-[var(--color-text-secondary)]">
                Q{index + 1}
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--color-bg-highest)] text-[var(--color-text-secondary)] font-label-caps text-label-caps text-[10px] uppercase tracking-wider">
                {QUESTION_TYPE_LABELS[question.question_type]}
              </span>
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="text-[var(--color-error)] hover:text-[var(--color-error-container)] transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>

          <div>
            <label className="block font-label-caps text-label-caps text-[var(--color-text-secondary)] mb-2">
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
              className="w-full bg-[#050505] border border-white/8 text-[var(--color-text-primary)] rounded px-4 py-3 font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all"
            />
          </div>

          {/* Options indents list */}
          {hasOptions && (
            <div className="pl-4 border-l border-white/10 flex flex-col gap-3 mt-2">
              <label className="block font-label-caps text-label-caps text-[var(--color-text-secondary)] mb-1">
                Options
              </label>
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
              <button
                type="button"
                onClick={addOption}
                disabled={disabled}
                className="self-start text-[var(--color-primary)] font-label-caps text-label-caps flex items-center gap-1 mt-2 hover:text-[var(--color-primary-fixed)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Add option
              </button>
            </div>
          )}

          {question.question_type === "short_text" && (
            <div className="mt-2">
              <input
                type="text"
                disabled
                placeholder="Participant will type short answer here..."
                className="w-full bg-transparent border-b border-white/20 pb-2 font-body-sm text-sm text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed outline-none"
              />
            </div>
          )}
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

  const [selectedType, setSelectedType] = React.useState<QuestionType>("single_choice");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = React.useState("");

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateLocalId(),
        question_text: "",
        question_type: selectedType,
        options: selectedType === "short_text" ? [] : ["", ""],
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
      <div
        role="status"
        className="glass-panel border-l-4 border-l-[var(--color-tertiary)] p-6 rounded-lg text-sm text-[var(--color-text-secondary)] mb-6 flex items-start gap-3"
      >
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
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="glass-panel rounded-lg p-6 mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
        <div className="flex-grow w-full sm:w-auto">
          <label className="block font-label-caps text-label-caps text-[var(--color-text-secondary)] mb-2">
            Question Type
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as QuestionType)}
              className="w-full appearance-none bg-[#050505] border border-white/8 text-[var(--color-text-primary)] rounded-full py-3 pl-4 pr-10 font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all cursor-pointer"
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                <option key={type} value={type}>
                  {QUESTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={addQuestion}
          disabled={isSaving}
          className="w-full sm:w-auto btn-primary bg-[var(--color-primary)] text-[var(--color-on-primary-fixed-variant)] rounded-full px-6 py-3 font-label-caps text-label-caps flex items-center justify-center gap-2 shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add question
        </button>
      </div>

      {/* Validation error */}
      {saveError && (
        <div
          role="alert"
          className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm rounded-lg mb-6 flex items-center gap-2"
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
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-lg text-[var(--color-text-secondary)]">
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

      {/* Sticky footer Save bar */}
      <div className="fixed bottom-0 left-0 w-full glass-panel border-t border-white/10 p-4 md:px-8 md:py-6 z-40 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm text-[var(--color-text-secondary)] font-body-sm">
          {questions.length} question{questions.length !== 1 ? "s" : ""} configured
          {saveStatus === "saved" && (
            <span className="text-[var(--color-secondary)] ml-3 font-semibold flex-inline items-center gap-1">
              ✓ Saved successfully
            </span>
          )}
        </span>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          disabled={isSaving || questions.length === 0}
          className="w-full md:w-auto btn-primary bg-[var(--color-primary)] text-[var(--color-on-primary-fixed-variant)] rounded-full px-8 py-4 font-label-caps text-label-caps text-sm transition-all"
        >
          {isSaving ? "Saving…" : "Save questionnaire"}
        </Button>
      </div>
    </div>
  );
}

