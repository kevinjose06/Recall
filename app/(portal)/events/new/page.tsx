"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import type { EventType } from "@/lib/types";

const EVENT_TYPES: EventType[] = [
  "Workshop",
  "Bootcamp",
  "Hackathon",
  "Technical Talk",
  "Other",
];

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const [fields, setFields] = React.useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    event_type: "" as EventType | "",
  });

  const [errors, setErrors] = React.useState({
    title: "",
    start_date: "",
    end_date: "",
    event_type: "",
  });

  function validate() {
    const newErrors = { title: "", start_date: "", end_date: "", event_type: "" };
    let valid = true;

    if (!fields.title.trim()) {
      newErrors.title = "Event title is required.";
      valid = false;
    }
    if (!fields.start_date) {
      newErrors.start_date = "Start date is required.";
      valid = false;
    }
    if (!fields.end_date) {
      newErrors.end_date = "End date is required.";
      valid = false;
    } else if (fields.start_date && fields.end_date < fields.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
      valid = false;
    }
    if (!fields.event_type) {
      newErrors.event_type = "Please select an event type.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        title: fields.title.trim(),
        description: fields.description.trim() || null,
        start_date: fields.start_date,
        end_date: fields.end_date,
        event_type: fields.event_type,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      setFormError("Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    router.push(`/events/${data.id}`);
  }

  return (
    <div className="page-container--narrow" style={{ paddingTop: "0.75rem" }}>
      {/* Back nav */}
      <button
        type="button"
        onClick={() => router.back()}
        className="slide-fill-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.875rem",
          color: "rgba(245, 245, 235, 0.78)",
          backgroundColor: "transparent",
          border: "1px solid rgba(245, 245, 235, 0.15)",
          borderRadius: "var(--radius-full)",
          padding: "8px 18px",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          marginBottom: "20px",
          transition: "border-color var(--transition-fast), color var(--transition-fast)",
        }}
      >
        <BackIcon />
        Back
      </button>

      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0", color: "#f5f5eb" }}>New event</h1>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <Input
            label="Event title"
            id="event-title"
            value={fields.title}
            onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder="e.g. Introduction to Machine Learning"
            error={errors.title}
            disabled={isLoading}
            maxLength={120}
          />

          <Textarea
            label="Description"
            id="event-description"
            value={fields.description}
            onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional — brief summary of the event for members' reference"
            disabled={isLoading}
            rows={3}
            maxLength={500}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Input
              label="Start date"
              id="event-start-date"
              type="date"
              value={fields.start_date}
              onChange={(e) => setFields((f) => ({ ...f, start_date: e.target.value }))}
              required
              error={errors.start_date}
              disabled={isLoading}
            />

            <Input
              label="End date"
              id="event-end-date"
              type="date"
              value={fields.end_date}
              onChange={(e) => setFields((f) => ({ ...f, end_date: e.target.value }))}
              required
              error={errors.end_date}
              disabled={isLoading}
            />
          </div>

          <Select
            label="Event type"
            id="event-type"
            value={fields.event_type}
            onChange={(e) =>
              setFields((f) => ({ ...f, event_type: e.target.value as EventType }))
            }
            required
            placeholder="Select a type"
            error={errors.event_type}
            disabled={isLoading}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          {formError && (
            <div
              role="alert"
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-error-subtle)",
                border: "1px solid var(--color-error-border)",
                color: "var(--color-error)",
                fontSize: "0.875rem",
              }}
            >
              {formError}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              paddingTop: "4px",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
