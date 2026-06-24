"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import type { Question } from "@/lib/types";
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
}: ResponsesToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = React.useState(false);
  const [exportError, setExportError] = React.useState("");
  const [sheetUrl, setSheetUrl] = React.useState("");

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
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  async function handleSaveToSheets() {
    setIsSaving(true);
    setExportError("");
    setSheetUrl("");

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/export-responses-to-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eventId }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Failed to save responses to Google Sheets."
        );
      }

      if (typeof payload.spreadsheetUrl === "string") {
        setSheetUrl(payload.spreadsheetUrl);
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Failed to save responses to Google Sheets."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.toolbarContainer}>
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
            { value: "summary", label: "Summary" },
            { value: "question", label: "Question" },
            { value: "individual", label: "Individual" },
          ]}
          onChange={(val) => updateViewParams({ mode: val as ViewMode })}
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
            disabled={questions.length === 0}
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
            disabled={responseOptions.length === 0}
            align="right"
          />
        )}
      </div>

      <div className={styles.toolbarActions}>
        <Button
          type="button"
          variant="secondary-light"
          size="sm"
          onClick={handleSaveToSheets}
          isLoading={isSaving}
          leftIcon={
            !isSaving ? (
              <span className="material-symbols-outlined text-sm">table_view</span>
            ) : undefined
          }
        >
          {isSaving ? "Saving" : "Save to Sheets"}
        </Button>

        {sheetUrl && (
          <a
            className={styles.exportStatusLink}
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open sheet
          </a>
        )}

        {exportError && (
          <span className={styles.exportStatusError} role="alert">
            {exportError}
          </span>
        )}
      </div>
    </div>
  );
}
