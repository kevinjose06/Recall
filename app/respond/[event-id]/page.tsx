import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantForm } from "@/components/ParticipantForm";
import { EventTypeBadge } from "@/components/ui/Badge";
import type { Question } from "@/lib/types";

interface PageProps {
  params: Promise<{ "event-id": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single();
  return {
    title: data?.title ? `Feedback — ${data.title}` : "Event Feedback",
    description: data?.title
      ? `Submit your feedback for ${data.title} — a CSA event at RIT Kottayam.`
      : "Submit event feedback.",
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventDates(startStr: string, endStr: string) {
  if (startStr === endStr) {
    return formatDate(startStr);
  }
  return `${formatDate(startStr)} — ${formatDate(endStr)}`;
}

export default async function RespondPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  // Public page — use anon client (no auth needed)
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, start_date, end_date, event_type")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  const hasQuestions = questions && questions.length > 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-base)",
        paddingBottom: "48px",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg-surface)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <img
          src="/csa-logo.png?v=2"
          alt="CSA logo"
          width={22}
          height={22}
          className="logo-adaptive"
          style={{ objectFit: "contain" }}
        />
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}
        >
          CSA Recall · RIT Kottayam
        </span>
      </header>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 20px 0" }}>
        {/* Event info */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <EventTypeBadge type={event.event_type} />
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {formatEventDates(event.start_date, event.end_date)}
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            {event.title}
          </h1>
          {event.description && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65, margin: 0 }}>
              {event.description}
            </p>
          )}
        </div>

        {/* No questions */}
        {!hasQuestions && (
          <div
            style={{
              padding: "32px 24px",
              backgroundColor: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
              The feedback form for this event hasn&apos;t been set up yet. Please check back later.
            </p>
          </div>
        )}

        {/* Form */}
        {hasQuestions && (
          <ParticipantForm
            eventId={eventId}
            eventTitle={event.title}
            eventType={event.event_type}
            questions={questions as Question[]}
          />
        )}
      </div>
    </div>
  );
}
