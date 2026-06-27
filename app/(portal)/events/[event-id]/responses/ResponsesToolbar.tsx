"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Question, Response } from "@/lib/types";
import styles from "./responses.module.css";

import Link from "next/link";

type ViewMode = "summary" | "question" | "individual";

interface ResponsesToolbarProps {
  eventId: string;
  eventTitle: string;
  mode: ViewMode;
  questions: Question[];
  responseOptions: { id: string; label: string }[];
  selectedQuestionId: string;
  selectedResponseId: string;
  responses: Response[];
  answers: any[];
}

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  align?: "left" | "right";
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  variant = "secondary",
  disabled = false,
  align = "left",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const containerClass = variant === "primary"
    ? `${styles.dropdownContainer} ${styles.primaryDropdownContainer}`
    : styles.dropdownContainer;

  const triggerClass = variant === "primary"
    ? `${styles.dropdownTrigger} ${styles.primaryDropdownTrigger}`
    : styles.dropdownTrigger;

  const menuClass = align === "right"
    ? `${styles.dropdownMenu} ${styles.dropdownMenuRight}`
    : styles.dropdownMenu;

  return (
    <div className={containerClass} ref={dropdownRef}>
      <button
        type="button"
        className={triggerClass}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span className={styles.dropdownValueText}>{selectedOption?.label || ""}</span>
        <span className={`${styles.dropdownArrow} material-symbols-outlined ${isOpen ? styles.dropdownArrowRotate : ""}`}>
          expand_more
        </span>
      </button>

      {isOpen && !disabled && (
        <div className={menuClass} role="listbox">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ""}`}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isActive && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResponsesToolbar({
  eventId,
  eventTitle,
  mode,
  questions,
  responseOptions,
  selectedQuestionId,
  selectedResponseId,
  responses,
  answers,
}: ResponsesToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  function handleDownloadExcel() {
    // Build CSV Headers
    const headers = [
      "Timestamp",
      "Respondent Name",
      "Respondent Token",
      ...questions.map(q => q.question_text)
    ];

    // Build CSV Rows
    const csvRows = responses.map(response => {
      const rowAnswers = questions.map(q => {
        const ans = answers.find(a => a.response_id === response.id && a.question_id === q.id);
        if (!ans) return "";
        const val = ans.answer_value;
        if (Array.isArray(val)) {
          return val.join("; ");
        }
        return String(val);
      });

      return [
        response.submitted_at ? new Date(response.submitted_at).toLocaleString() : "",
        response.respondent_name || "Anonymous",
        response.respondent_token || "",
        ...rowAnswers
      ];
    });

    // Format as CSV
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...csvRows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const sanitizedTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.setAttribute("download", `recall-${sanitizedTitle}-responses.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  function updateViewParams(next: {
    mode?: ViewMode;
    questionId?: string;
    responseId?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextMode = next.mode ?? mode;

    if (nextMode === "summary") {
      params.delete("view");
      params.delete("question");
      params.delete("response");
    } else {
      params.set("view", nextMode);
      params.delete(nextMode === "question" ? "response" : "question");

      if (nextMode === "question") {
        params.set("question", next.questionId ?? selectedQuestionId ?? questions[0]?.id ?? "");
      }

      if (nextMode === "individual") {
        params.set("response", next.responseId ?? selectedResponseId ?? responseOptions[0]?.id ?? "");
      }
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }



  return (
    <div style={{ position: "relative" }}>
      {/* Pending transition indicator */}
      {isPending && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
          backgroundSize: "200% 100%",
          animation: "shine-skeleton 1.2s ease-in-out infinite",
          borderRadius: "9999px",
          zIndex: 10,
        }} />
      )}
      <div className={styles.toolbarContainer} style={{ opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s ease" }}>
        <Link href={`/events/${eventId}`} className={styles.backLink}>
          <Button
            type="button"
            variant="secondary-light"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          >
            {eventTitle}
          </Button>
        </Link>

        <div className={styles.toolbarFields}>
          <CustomDropdown
            label="View mode"
            variant="primary"
            value={mode}
            options={[
              { value: "summary", label: isPending ? "Loading…" : "Summary" },
              { value: "question", label: "Question" },
              { value: "individual", label: "Individual" },
            ]}
            onChange={(val) => updateViewParams({ mode: val as ViewMode })}
            disabled={isPending}
          />

          {mode === "question" && (
            <CustomDropdown
              label="Question"
              value={selectedQuestionId}
              options={questions.map((question, index) => ({
                value: question.id,
                label: `Q${index + 1}: ${question.question_text}`,
              }))}
              onChange={(val) => updateViewParams({ mode: "question", questionId: val })}
              disabled={questions.length === 0 || isPending}
              align="right"
            />
          )}

          {mode === "individual" && (
            <CustomDropdown
              label="Respondent"
              value={selectedResponseId}
              options={responseOptions.map((response) => ({
                value: response.id,
                label: response.label,
              }))}
              onChange={(val) => updateViewParams({ mode: "individual", responseId: val })}
              disabled={responseOptions.length === 0 || isPending}
              align="right"
            />
          )}
        </div>

        <div className={styles.toolbarActions}>
          <Button
            type="button"
            variant="secondary-light"
            size="sm"
            onClick={handleDownloadExcel}
            leftIcon={<span className="material-symbols-outlined text-sm">table_view</span>}
          >
            Save as Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
