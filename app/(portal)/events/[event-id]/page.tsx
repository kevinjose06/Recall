import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EventTypeBadge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";

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
  return { title: data?.title ?? "Event" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventDates(startStr: string, endStr: string) {
  if (startStr === endStr) {
    return formatDate(startStr);
  }
  // Remove weekday for range formatting if it's too long, or use short/standard representation
  const formatShort = (str: string) =>
    new Date(str).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return `${formatShort(startStr)} — ${formatShort(endStr)}`;
}

function BuilderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M13 13.5v1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="10" width="3" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="6" y="6" width="3" height="9" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="11" y="2" width="3" height="13" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export default async function EventDetailPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { count: responseCount } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  // Build the participant link
  // In production this would use the actual domain from env.
  const participantLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/respond/${eventId}`
      : `https://csa-feedback.vercel.app/respond/${eventId}`;

  return (
    <div className="page-container">
      {/* Back nav */}
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.875rem",
          color: "var(--color-text-secondary)",
          textDecoration: "none",
          marginBottom: "24px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All events
      </Link>

      {/* Event header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <EventTypeBadge type={event.event_type} />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {formatEventDates(event.start_date, event.end_date)}
          </span>
        </div>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          {event.title}
        </h1>
        {event.description && (
          <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", maxWidth: "600px", margin: 0 }}>
            {event.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        {[
          { label: "Responses", value: responseCount ?? 0, accent: (responseCount ?? 0) > 0 },
          { label: "Questions", value: questionCount ?? 0, accent: false },
        ].map(({ label, value, accent }) => (
          <Card key={label} padding="md">
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginBottom: "6px",
                fontWeight: 500,
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: accent ? "var(--color-success)" : "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {value}
            </p>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
        <Link href={`/events/${eventId}/builder`}>
          <Button variant="secondary" leftIcon={<BuilderIcon />}>
            Questionnaire builder
          </Button>
        </Link>
        <Link href={`/events/${eventId}/responses`}>
          <Button variant="secondary" leftIcon={<ChartIcon />}>
            View responses
          </Button>
        </Link>
      </div>

      {/* Participant link card */}
      <Card>
        <CardHeader>
          <CardTitle>Participant link</CardTitle>
        </CardHeader>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "14px" }}>
          Share this link with event attendees. Anyone with the link can submit feedback — no account required.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            backgroundColor: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: "0.875rem",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-secondary)",
              wordBreak: "break-all",
              minWidth: 0,
            }}
          >
            /respond/{eventId}
          </code>
          <ParticipantLinkCopy eventId={eventId} />
        </div>
      </Card>
    </div>
  );
}

// Client component just for the copy button (needs window.location)
function ParticipantLinkCopy({ eventId }: { eventId: string }) {
  // We render this server-side but the CopyButton itself is client-only.
  // The text defaults to the path; in production use an env var for base URL.
  const path = `/respond/${eventId}`;
  return <CopyButton text={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${path}`} label="Copy link" />;
}
