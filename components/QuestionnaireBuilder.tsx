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
import { saveQuestions, updateEventPublishStatus } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AIButton } from "@/components/ui/AIButton";
import type { Question, QuestionType } from "@/lib/types";
import { AIGeneratorModal } from "./AIGeneratorModal";

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
  isPublished: boolean;
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
      className={`relative max-w-3xl mx-auto w-full ${isDragging ? "z-[999]" : ""}`}
    >
      <div
        className={`w-full rounded-xl transition-all duration-300 ${
          isDragging 
            ? "bg-[#121214] border border-[var(--color-primary)] shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_15px_rgba(123,164,255,0.15)]" 
            : "bg-[#0f0f0f] border border-white/10 shadow-md hover:border-white/20"
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
          animation: dropdownReveal 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: rgba(12, 12, 14, 0.98);
          backdrop-filter: blur(22px) saturate(150%);
          border: 1px solid rgba(123, 164, 255, 0.16);
          box-shadow:
            0 18px 44px -16px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.025);
        }
        .premium-item {
          min-height: 42px;
          transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        }
        .premium-item:hover {
          background: rgba(255, 255, 255, 0.055) !important;
        }
        .premium-item-active {
          background: rgba(123, 164, 255, 0.12) !important;
          box-shadow: inset 0 0 0 1px rgba(123, 164, 255, 0.24);
        }
        .premium-btn {
          background: rgba(22, 22, 25, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .premium-btn:hover {
          background: rgba(30, 30, 34, 0.96) !important;
          border-color: rgba(123, 164, 255, 0.32) !important;
          box-shadow: 0 10px 24px -18px rgba(123, 164, 255, 0.65) !important;
        }
        .type-trigger[data-open="true"] {
          background: rgba(30, 30, 34, 0.98);
          border-color: rgba(123, 164, 255, 0.42);
          box-shadow: 0 12px 28px -20px rgba(123, 164, 255, 0.75);
        }
        .type-dropdown-menu {
          padding: 12px 20px !important;
        }
        .premium-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .type-option-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.055);
          color: rgba(255, 255, 255, 0.52);
          flex-shrink: 0;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        .premium-item:hover .type-option-icon-box {
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.86);
        }
        .premium-item-active .type-option-icon-box {
          background: rgba(123, 164, 255, 0.14);
          border-color: rgba(123, 164, 255, 0.26);
          color: var(--color-primary);
        }
        @media (min-width: 768px) {
          .type-dropdown-menu {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }
          .premium-icon-box {
            width: 32px;
            height: 32px;
          }
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
      {/* Drag Header / Handle */}
      <div 
        {...(dragHandleProps ?? {})}
        className="w-full flex items-center justify-between px-4 py-2 bg-white/[0.01] hover:bg-white/[0.03] active:bg-[var(--color-primary)]/10 border-b border-white/5 transition-colors group/drag cursor-grab active:cursor-grabbing rounded-t-xl"
        title="Drag to reorder"
        style={{ touchAction: 'none' }}
      >
        {/* Left: Spacer to center grip */}
        <div className="w-6 h-6 flex items-center justify-center select-none" aria-hidden="true" />

        {/* Center: Grip Icon */}
        <div className="flex items-center gap-0.5 text-white/20 group-hover/drag:text-[var(--color-primary)]/70 transition-colors">
          <span className="material-symbols-outlined text-[20px] select-none">
            drag_indicator
          </span>
        </div>

        {/* Right: Spacer to center grip */}
        <div className="w-6 h-6 flex items-center justify-center select-none" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-6 premium-card-content">
        {/* Top Row: Question Input */}
        <div className="w-full">
          <div className="flex items-start gap-3 mobile-input-offset desktop-input-offset">
            <span className="text-lg font-bold text-[var(--color-primary)] select-none font-mono min-w-[28px] text-right mt-3">
              {index + 1}.
            </span>
            <textarea
              value={question.question_text}
              onChange={(e) => {
                onChange({ ...question, question_text: e.target.value });
                // auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              disabled={disabled}
              placeholder="Question title"
              rows={1}
              className="flex-grow bg-[#1a1a1a] border-b-2 border-white/10 hover:border-white/30 text-[var(--color-text-primary)] font-body-lg text-lg focus:outline-none focus:border-[var(--color-primary)] transition-all rounded-t-md placeholder:text-white/30 w-full resize-none overflow-hidden"
              style={{ 
                padding: '12px 16px', 
                minHeight: '56px',
                lineHeight: '1.5',
              }}
            />
          </div>
        </div>

        {/* Second Row: Options and Right Controls */}
        <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-start w-full mt-2 relative gap-5 md:gap-0">
          
          {/* Options Area */}
          <div className="order-2 pl-1 w-full md:order-1 md:max-w-[60%]">
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
          <div className="contents md:order-2 md:flex md:flex-col md:items-end md:gap-5 md:flex-shrink-0 md:w-auto md:ml-4 animate-fade-in mobile-right-controls-offset desktop-right-controls-offset">
            {/* Question Type Dropdown */}
            <div className="relative order-1 w-fit max-w-full md:order-none" ref={dropdownRef}>
              <div 
                className={`type-trigger flex w-fit max-w-full items-center justify-between gap-2 rounded-lg cursor-pointer select-none premium-btn px-3 py-2 md:min-w-[220px] md:gap-4 md:px-4 md:py-2.5 ${
                  disabled ? 'opacity-50 cursor-not-allowed border-white/5' : ''
                }`}
                data-open={isDropdownOpen ? "true" : "false"}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="premium-icon-box" style={{ background: 'rgba(123, 164, 255, 0.1)', borderColor: 'rgba(123, 164, 255, 0.2)' }}>
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[18px] md:text-[20px]">
                      {QUESTION_TYPE_ICONS[question.question_type]}
                    </span>
                  </div>
                  <span className="font-body-sm text-sm font-medium whitespace-nowrap text-white md:text-base">{QUESTION_TYPE_LABELS[question.question_type]}</span>
                </div>
                <span className={`material-symbols-outlined text-[var(--color-text-secondary)] text-[20px] transition-transform duration-250 md:text-[22px] ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}>
                  expand_more
                </span>
              </div>
              
              {isDropdownOpen && !disabled && (
                <div
                  className="absolute left-0 top-[calc(100%+8px)] z-50 flex w-[min(270px,calc(100vw-72px))] origin-top flex-col gap-1 rounded-xl premium-dropdown type-dropdown-menu md:left-auto md:right-0 md:w-[280px]"
                  role="listbox"
                >
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => {
                    const isActive = question.question_type === type;
                    return (
                      <div
                        key={type}
                        className={`cursor-pointer rounded-lg px-3 py-2 font-body-sm text-[0.92rem] flex items-center justify-between gap-3 group/item premium-item ${
                          isActive 
                            ? 'premium-item-active text-[var(--color-primary)] font-semibold' 
                            : 'text-[var(--color-text-secondary)] hover:text-white'
                        }`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          changeQuestionType(type);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="type-option-icon-box">
                            <span className="material-symbols-outlined text-[18px]">
                              {QUESTION_TYPE_ICONS[type]}
                            </span>
                          </div>
                          <span className="whitespace-nowrap leading-none">{QUESTION_TYPE_LABELS[type]}</span>
                        </div>
                        {isActive && (
                          <span className="material-symbols-outlined mr-0.5 text-[18px] text-[var(--color-primary)]">check</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer actions: Duplicate, Delete, Required Toggle */}
            <div className="order-3 flex items-center justify-end gap-6 relative md:order-none" style={{ zIndex: 10 }}>
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
    </div>
  );
}

// ─── Main builder ──────────────────────────────────────────────

export function QuestionnaireBuilder({
  eventId,
  eventTitle,
  initialQuestions,
  isLocked,
  isPublished,
}: BuilderProps) {
  const [published, setPublished] = React.useState(isPublished);
  const [isTogglingPublish, setIsTogglingPublish] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function handleTogglePublish() {
    setIsTogglingPublish(true);
    try {
      const newStatus = !published;
      await updateEventPublishStatus(eventId, newStatus);
      setPublished(newStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingPublish(false);
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/respond/${eventId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error" | "validation_error">("idle");
  const [saveError, setSaveError] = React.useState("");

  const [isAIModalOpen, setIsAIModalOpen] = React.useState(false);

  // ── Scroll-aware navbar visibility ────────────────────────────
  const [navbarVisible, setNavbarVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollTicking = React.useRef(false);

  React.useEffect(() => {
    function onScroll() {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        // Try portal-main first (bounded scroll), fall back to window
        const scrollEl = document.getElementById("main-content");
        const currentY = (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight)
          ? scrollEl.scrollTop
          : window.scrollY;
        const delta = currentY - lastScrollY.current;
        if (Math.abs(delta) > 4) {
          setNavbarVisible(delta < 0 || currentY < 60);
          lastScrollY.current = currentY;
        }
        scrollTicking.current = false;
      });
    }

    // Attach to both so we catch whichever one actually scrolls
    window.addEventListener("scroll", onScroll, { passive: true });
    const el = document.getElementById("main-content");
    el?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      el?.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Long-press tooltip state & references
  const touchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const didLongPressRef = React.useRef(false);
  const [activeTooltip, setActiveTooltip] = React.useState<"preview" | "copy" | "publish" | null>(null);

  const handleTouchStart = (type: "preview" | "copy" | "publish") => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    didLongPressRef.current = false;
    touchTimeoutRef.current = setTimeout(() => {
      setActiveTooltip(type);
      didLongPressRef.current = true;
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setActiveTooltip(null);
    if (didLongPressRef.current) {
      setTimeout(() => {
        didLongPressRef.current = false;
      }, 100);
    }
  };

  const handleTouchCancel = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setActiveTooltip(null);
    didLongPressRef.current = false;
  };

  React.useEffect(() => {
    const hasAutoOpened = sessionStorage.getItem(`ai-auto-opened-${eventId}`);
    if (initialQuestions.length === 0 && !hasAutoOpened) {
      setIsAIModalOpen(true);
      sessionStorage.setItem(`ai-auto-opened-${eventId}`, "true");
    }
  }, [initialQuestions, eventId]);

  function handleAddAIQuestions(newAIQuestions: Array<{
    question_text: string;
    question_type: QuestionType;
    options: string[] | null;
    is_required: boolean;
  }>) {
    if (isLocked) return;
    setQuestionsWithHistory((prev) => {
      const startOrderIndex = prev.length;
      const formatted: DraftQuestion[] = newAIQuestions.map((q, idx) => ({
        id: generateLocalId(),
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? [],
        order_index: startOrderIndex + idx,
        is_required: q.is_required,
      }));
      return [...prev, ...formatted];
    });
  }

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
    if (isLocked) return;
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
    if (isLocked) return;
    setQuestionsWithHistory((prev) =>
      prev.map((q) => (q.id === id ? updated : q))
    );
  }

  function removeQuestion(id: string) {
    if (isLocked) return;
    setQuestionsWithHistory((prev) =>
      prev
          .filter((q) => q.id !== id)
          .map((q, i) => ({ ...q, order_index: i }))
    );
  }

  function onDragEnd(result: DropResult) {
    if (isLocked || !result.destination) return;
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

  async function performSave(questionsToSave: DraftQuestion[]) {
    setIsSaving(true);
    setSaveStatus("saving");
    setSaveError("");

    try {
      const rows = questionsToSave.map((q, i) => ({
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
      setTimeout(() => {
        setSaveStatus((current) => current === "saved" ? "idle" : current);
      }, 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setSaveStatus("validation_error");
      setSaveError(err);
      return;
    }
    await performSave(questions);
  }

  // Debounced auto-save effect
  const isInitialMount = React.useRef(true);
  const questionsContentSignature = JSON.stringify(
    questions.map((q) => ({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      order_index: q.order_index,
      is_required: q.is_required,
    }))
  );

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isLocked) return;

    const delayDebounceFn = setTimeout(() => {
      const err = validate();
      if (err) {
        setSaveStatus("validation_error");
        setSaveError(err);
        return;
      }
      performSave(questions);
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [questionsContentSignature, isLocked]);

  return (
    <div>
      <style>{`
        /* Scroll-aware navbar transition */
        .responsive-navbar {
          transition: top     0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .responsive-navbar--hidden {
          top: -140px !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Responsive controls bar overrides for mobile only */
        @media (max-width: 767px) {
          .responsive-navbar {
            top: 10px !important;
            width: calc(100vw - 20px) !important;
            max-width: 460px !important;
            height: auto !important;
            min-height: unset !important;
            padding: 10px 14px !important;
            gap: 8px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            border-radius: 20px !important;
          }
          .responsive-navbar > div:first-child {
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .responsive-navbar > div:last-child {
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .responsive-navbar-options {
            gap: 8px !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .responsive-navbar-count {
            font-size: 0.88rem !important;
            white-space: nowrap !important;
          }
          .responsive-navbar-count > span:nth-of-type(2) {
            display: none !important;
          }
          .responsive-navbar-divider {
            padding-right: 8px !important;
            margin-right: 2px !important;
          }
          .responsive-button-text {
            display: inline-block !important;
            font-size: 0.75rem !important;
            font-weight: 600 !important;
          }
          .responsive-button-padding {
            padding: 0 12px !important;
            width: auto !important;
            height: 38px !important;
            min-width: unset !important;
            justify-content: center !important;
            gap: 5px !important;
          }
          .responsive-button-padding > span:nth-of-type(2) {
            display: inline-flex !important;
          }
          .responsive-navbar-divider button {
            padding: 5px !important;
          }
          .responsive-navbar-divider button span {
            font-size: 20px !important;
          }
          /* Unsaved warning text - allow wrapping */
          .responsive-navbar [title] {
            white-space: normal !important;
            text-align: center !important;
            max-width: 220px !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-tooltip-fade {
          animation: tooltipFade 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Fixed Navbar Controls */}
      <div 
        className={`fixed z-[100] flex items-center justify-center gap-8 bg-[#141414]/95 border border-white/10 rounded-full backdrop-blur-md shadow-2xl w-max responsive-navbar${navbarVisible ? '' : ' responsive-navbar--hidden'}`}
        style={{ minHeight: '82px', padding: '0 56px', top: '24px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[1.15rem] font-semibold text-white tracking-wide responsive-navbar-count">
            {questions.length} <span className="responsive-button-text">Question{questions.length !== 1 ? "s" : ""}</span><span className="md:hidden">Q{questions.length !== 1 ? "s" : ""}</span>
          </span>
          {saveStatus === "saving" && (
            <span className="text-[var(--color-primary)] text-[1.05rem] font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined text-[18px] animate-spin-slow">sync</span> <span className="responsive-button-text">Saving...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[var(--color-secondary)] text-[1.05rem] font-semibold flex items-center gap-1.5 animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> <span className="responsive-button-text">Saved</span>
            </span>
          )}
          {saveStatus === "validation_error" && (
            <span className="text-[var(--color-warning)] text-[1.05rem] font-semibold flex items-center gap-1.5" title={saveError || "Some fields have validation errors"}>
              <span className="material-symbols-outlined text-[18px]">warning</span> <span className="responsive-button-text">Unsaved (fix errors)</span>
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

          <Link 
            href={`/respond/${eventId}`} 
            target="_blank"
            onClick={(e) => {
              if (didLongPressRef.current) {
                e.preventDefault();
              }
            }}
          >
            <Button
              variant="primary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[20px]">visibility</span>}
              className="responsive-button-padding"
              style={{ overflow: "visible" }}
              onTouchStart={() => handleTouchStart("preview")}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchCancel}
            >
              <span className="responsive-button-text">Preview</span>
              {activeTooltip === "preview" && (
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-[#18181b] border border-white/10 text-white text-[11px] font-semibold py-1.5 px-3 rounded-md shadow-2xl pointer-events-none z-[1000] whitespace-nowrap animate-tooltip-fade">
                  Preview
                </div>
              )}
            </Button>
          </Link>

          {published && (
            <Button
              onClick={(e) => {
                if (didLongPressRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                handleCopyLink();
              }}
              variant="secondary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[20px]">{copied ? "done" : "content_copy"}</span>}
              className="responsive-button-padding"
              style={{ overflow: "visible" }}
              onTouchStart={() => handleTouchStart("copy")}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchCancel}
            >
              <span className="responsive-button-text">{copied ? "Copied!" : "Copy Link"}</span>
              {activeTooltip === "copy" && (
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-[#18181b] border border-white/10 text-white text-[11px] font-semibold py-1.5 px-3 rounded-md shadow-2xl pointer-events-none z-[1000] whitespace-nowrap animate-tooltip-fade">
                  {copied ? "Copied!" : "Copy Link"}
                </div>
              )}
            </Button>
          )}

          <Button
            onClick={(e) => {
              if (didLongPressRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              handleTogglePublish();
            }}
            isLoading={isTogglingPublish}
            disabled={isTogglingPublish || questions.length === 0}
            variant={published ? "danger" : "secondary-light"}
            size="md"
            leftIcon={<span className="material-symbols-outlined text-[20px]">{published ? "unpublished" : "publish"}</span>}
            className="responsive-button-padding"
            style={{ overflow: "visible" }}
            onTouchStart={() => handleTouchStart("publish")}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchCancel}
          >
            <span className="responsive-button-text">{published ? "Unpublish" : "Publish"}</span>
            {activeTooltip === "publish" && (
              <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-[#18181b] border border-white/10 text-white text-[11px] font-semibold py-1.5 px-3 rounded-md shadow-2xl pointer-events-none z-[1000] whitespace-nowrap animate-tooltip-fade">
                {published ? "Unpublish" : "Publish"}
              </div>
            )}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
                Questionnaire builder
              </h1>
              <ul className="list-disc pl-5 m-0 text-white/90 text-[0.9375rem] font-medium tracking-wide">
                <li>Drag cards by the top handle to reorder questions</li>
              </ul>
            </div>
            <AIButton
              onClick={() => setIsAIModalOpen(true)}
              disabled={isLocked}
              icon="auto_awesome"
              size="md"
              style={{ flexShrink: 0, alignSelf: "flex-start" }}
            >
              Generate with AI
            </AIButton>
          </div>
        </Card>
      </div>

      <div className="pt-6">
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
                      disabled={isLocked}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <div className="flex justify-center mt-8">
                <Button
                  onClick={addQuestion}
                  disabled={isLocked}
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

      <AIGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onAddQuestions={handleAddAIQuestions}
      />
    </div>
  );
}
