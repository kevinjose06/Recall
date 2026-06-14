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
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 w-full group">
      <span className="material-symbols-outlined text-white/20 text-[18px] opacity-0 group-hover:opacity-100 transition-opacity select-none">
        drag_indicator
      </span>
      <input
        type="radio"
        disabled
        className="w-4 h-4 rounded-full border border-white/20 bg-transparent text-[var(--color-primary)] focus:ring-0 shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Option ${index + 1}`}
        className="flex-grow bg-transparent border-b border-transparent hover:border-white/10 text-[var(--color-text-primary)] font-body-sm text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all py-2 px-1 placeholder:text-white/30"
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
      className={`relative bg-[#0f0f0f] border border-white/10 rounded-xl transition-all duration-300 max-w-3xl mx-auto w-full ${
        isDragging ? "border-[var(--color-primary)]/50 shadow-2xl scale-[1.01] z-50" : "shadow-md hover:border-white/20"
      }`}
    >
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

      <div className="px-8 pb-8 pt-2 flex flex-col gap-6">
        {/* Top Row: Question Input and Type Dropdown */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full">
          {/* Question text input */}
          <input
            type="text"
            value={question.question_text}
            onChange={(e) => onChange({ ...question, question_text: e.target.value })}
            disabled={disabled}
            placeholder="Question title"
            className="flex-grow bg-[#1a1a1a] border-b-2 border-white/10 hover:border-white/30 text-[var(--color-text-primary)] font-body-lg text-lg focus:outline-none focus:border-[var(--color-primary)] transition-all py-3 px-4 rounded-t-md placeholder:text-white/30 w-full sm:w-auto"
          />

          {/* Question Type Dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <div 
              className={`flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border rounded-md cursor-pointer transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed border-white/5' : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="font-body-sm text-sm whitespace-nowrap">{QUESTION_TYPE_LABELS[question.question_type]}</span>
              <span className={`material-symbols-outlined text-[var(--color-text-secondary)] text-[18px] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
            
            {isDropdownOpen && !disabled && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-48 z-50 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl py-1">
                {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                  <div
                    key={type}
                    className={`px-4 py-2 cursor-pointer font-body-sm text-sm transition-colors flex items-center justify-between ${
                      question.question_type === type ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-primary)] hover:bg-white/5'
                    }`}
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
            )}
          </div>
        </div>

        {/* Options Area */}
        <div className="pl-1 mt-2">
          {hasOptions && (
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
              <div className="flex items-center gap-3 mt-1">
                <span className="material-symbols-outlined text-transparent select-none text-[18px]">drag_indicator</span>
                <input type="radio" disabled className="w-4 h-4 rounded-full border border-white/20 bg-transparent focus:ring-0 shrink-0" />
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
            <div className="pt-2 pb-4 px-1">
              <input
                type="text"
                disabled
                placeholder="Short answer text"
                className="w-1/2 bg-transparent border-b border-white/20 pb-2 font-body-sm text-sm text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions: Duplicate, Delete, Required Toggle */}
        <div className="flex items-center justify-end gap-6 pt-4 mt-2">
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
          q.question_type === "short_text" ? null : q.options.map((o) => o.trim()),
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
      {/* Fixed Navbar Controls */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center gap-8 bg-[#141414]/95 border border-white/10 px-8 py-5 rounded-full backdrop-blur-md shadow-2xl w-max">
        <div className="flex items-center gap-4">
          <span className="text-[1.05rem] font-semibold text-white tracking-wide">
            {questions.length} Question{questions.length !== 1 ? "s" : ""}
          </span>
          {saveStatus === "saved" && (
            <span className="text-[var(--color-secondary)] text-[1.05rem] font-semibold flex items-center gap-1.5 animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-[var(--color-error)] text-[1.05rem] font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">error</span> Error
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Undo / Redo controls */}
          <div className="flex items-center gap-1 pr-4 border-r border-white/10">
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
            >
              Preview
            </Button>
          </Link>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || questions.length === 0}
            variant="secondary-light"
            size="md"
            leftIcon={<span className="material-symbols-outlined text-[20px]">save</span>}
          >
            Save
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
