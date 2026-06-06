"use client";

import * as React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvidedDraggableProps,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          border: "1.5px solid var(--color-text-muted)",
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Option ${index + 1}`}
        aria-label={`Option ${index + 1}`}
        style={{
          flex: 1,
          height: "34px",
          padding: "0 10px",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-bg-subtle)",
          color: "var(--color-text-primary)",
          fontSize: "0.875rem",
          fontFamily: "var(--font-sans)",
          outline: "none",
          transition: "border-color var(--transition-fast)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-focus)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove || disabled}
        aria-label={`Remove option ${index + 1}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-md)",
          border: "none",
          backgroundColor: "transparent",
          color: "var(--color-text-muted)",
          cursor: !canRemove || disabled ? "not-allowed" : "pointer",
          opacity: !canRemove || disabled ? 0.4 : 1,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (canRemove && !disabled) {
            e.currentTarget.style.backgroundColor = "var(--color-error-subtle)";
            e.currentTarget.style.color = "var(--color-error)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--color-text-muted)";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
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

  function addOption() {
    onChange({ ...question, options: [...question.options, ""] });
  }

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
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: `1px solid ${isDragging ? "var(--color-border-focus)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "16px",
        boxShadow: isDragging ? "var(--shadow-lg)" : "var(--shadow-xs)",
        transition: "box-shadow var(--transition-fast), border-color var(--transition-fast)",
        ...(draggableProps.style as React.CSSProperties | undefined),
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {/* Drag handle */}
        <button
          {...(dragHandleProps ?? {})}
          type="button"
          disabled={disabled}
          aria-label={`Drag to reorder question ${index + 1}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            cursor: disabled ? "not-allowed" : "grab",
            flexShrink: 0,
            marginTop: "5px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="4.5" cy="3.5" r="1" fill="currentColor" />
            <circle cx="9.5" cy="3.5" r="1" fill="currentColor" />
            <circle cx="4.5" cy="7" r="1" fill="currentColor" />
            <circle cx="9.5" cy="7" r="1" fill="currentColor" />
            <circle cx="4.5" cy="10.5" r="1" fill="currentColor" />
            <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Question number + type */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Q{index + 1}
            </span>
            <select
              value={question.question_type}
              onChange={(e) => {
                const type = e.target.value as QuestionType;
                const needsOptions = type === "single_choice" || type === "mcq";
                onChange({
                  ...question,
                  question_type: type,
                  options:
                    needsOptions && question.options.length < 2
                      ? ["", ""]
                      : needsOptions
                      ? question.options
                      : [],
                });
              }}
              disabled={disabled}
              aria-label={`Question ${index + 1} type`}
              style={{
                height: "26px",
                padding: "0 24px 0 8px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-bg-subtle)",
                color: "var(--color-text-secondary)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' stroke='%23999' strokeWidth='1.25' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 6px center",
              }}
            >
              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(
                (type) => (
                  <option key={type} value={type}>
                    {QUESTION_TYPE_LABELS[type]}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Question text */}
          <input
            type="text"
            value={question.question_text}
            onChange={(e) =>
              onChange({ ...question, question_text: e.target.value })
            }
            disabled={disabled}
            placeholder="Type your question here"
            aria-label={`Question ${index + 1} text`}
            style={{
              width: "100%",
              height: "38px",
              padding: "0 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-sans)",
              outline: "none",
              transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border-focus)";
              e.currentTarget.style.boxShadow = "0 0 0 3px hsl(231 48% 48% / 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Delete question */}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Delete question ${index + 1}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-md)",
            border: "1px solid transparent",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            cursor: disabled ? "not-allowed" : "pointer",
            flexShrink: 0,
            marginTop: "2px",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = "var(--color-error-subtle)";
              e.currentTarget.style.borderColor = "var(--color-error-border)";
              e.currentTarget.style.color = "var(--color-error)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3.5h10M6 3.5V2h4v1.5M5 6l.5 7M8 6v7M11 6l-.5 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Options */}
      {hasOptions && (
        <div
          style={{
            paddingLeft: "38px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
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
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8125rem",
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: "var(--font-sans)",
              width: "fit-content",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add option
          </button>
        </div>
      )}
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

  function addQuestion(type: QuestionType = "single_choice") {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateLocalId(),
        question_text: "",
        question_type: type,
        options: type === "short_text" ? [] : ["", ""],
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
      const supabase = createClient();

      // Delete all existing questions, then re-insert.
      // Simpler than diffing for an internal tool.
      await supabase
        .from("questions")
        .delete()
        .eq("event_id", eventId);

      const rows = questions.map((q, i) => ({
        event_id: eventId,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options:
          q.question_type === "short_text" ? null : q.options.map((o) => o.trim()),
        order_index: i,
      }));

      const { data, error } = await supabase
        .from("questions")
        .insert(rows)
        .select("id, order_index");

      if (error) throw error;

      // Update local state with saved IDs
      setQuestions((prev) =>
        prev.map((q, i) => ({
          ...q,
          saved_id: data?.[i]?.id ?? q.saved_id,
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
        style={{
          padding: "16px 20px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-warning-subtle)",
          border: "1px solid var(--color-warning-border)",
          color: "var(--color-warning)",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: "1px" }}>
          <path d="M9 2L1.5 15.5h15L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 7v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div>
          <strong style={{ fontWeight: 600 }}>Questionnaire locked.</strong>{" "}
          This event already has responses. The questionnaire cannot be edited to preserve data integrity.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Questions list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}
            >
              {questions.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 24px",
                    border: "2px dashed var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    color: "var(--color-text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
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
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add question buttons */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        {(["single_choice", "mcq", "short_text"] as QuestionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addQuestion(type)}
            disabled={isSaving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "34px",
              padding: "0 12px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "border-color var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.color = "var(--color-accent)";
              e.currentTarget.style.backgroundColor = "var(--color-accent-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {QUESTION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Validation error */}
      {saveError && (
        <div
          role="alert"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-error-subtle)",
            border: "1px solid var(--color-error-border)",
            color: "var(--color-error)",
            fontSize: "0.875rem",
            marginBottom: "16px",
          }}
        >
          {saveError}
        </div>
      )}

      {/* Save bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 16px",
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {questions.length} question{questions.length !== 1 ? "s" : ""}
          {saveStatus === "saved" && (
            <span style={{ color: "var(--color-success)", marginLeft: "10px" }}>
              ✓ Saved
            </span>
          )}
        </span>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          disabled={isSaving || questions.length === 0}
        >
          {isSaving ? "Saving…" : "Save questionnaire"}
        </Button>
      </div>
    </div>
  );
}
