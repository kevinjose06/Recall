"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import type { Question } from "@/lib/types";
import styles from "./responses.module.css";

type ViewMode = "summary" | "question" | "individual";

interface ResponsesToolbarProps {
  eventId: string;
  mode: ViewMode;
  questions: Question[];
  responseOptions: { id: string; label: string }[];
  selectedQuestionId: string;
  selectedResponseId: string;
}

function ToolbarSelect({
  label,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <label className={`${styles.toolbarSelectLabel} ${className}`}>
      <span className="sr-only">{label}</span>
      <select className={styles.toolbarSelect} aria-label={label} {...props}>
        {children}
      </select>
      <span className="material-symbols-outlined" aria-hidden="true">
        expand_more
      </span>
    </label>
  );
}

export function ResponsesToolbar({
  eventId,
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
    <div className={styles.toolbar}>
      <div className={styles.toolbarFields}>
        <ToolbarSelect
          label="View mode"
          id="responses-view-mode"
          value={mode}
          onChange={(event) =>
            updateViewParams({ mode: event.target.value as ViewMode })
          }
        >
          <option value="summary">Summary</option>
          <option value="question">Question</option>
          <option value="individual">Individual</option>
        </ToolbarSelect>

        {mode === "question" && (
          <ToolbarSelect
            label="Question"
            id="responses-question"
            value={selectedQuestionId}
            onChange={(event) =>
              updateViewParams({ mode: "question", questionId: event.target.value })
            }
            disabled={questions.length === 0}
          >
            {questions.map((question, index) => (
              <option key={question.id} value={question.id}>
                {`Q${index + 1}: ${question.question_text}`}
              </option>
            ))}
          </ToolbarSelect>
        )}

        {mode === "individual" && (
          <ToolbarSelect
            label="Respondent"
            id="responses-respondent"
            value={selectedResponseId}
            onChange={(event) =>
              updateViewParams({ mode: "individual", responseId: event.target.value })
            }
            disabled={responseOptions.length === 0}
          >
            {responseOptions.map((response) => (
              <option key={response.id} value={response.id}>
                {response.label}
              </option>
            ))}
          </ToolbarSelect>
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
