import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getResponseCountAdmin } from "@/lib/db-admin";
import { adminDb } from "@/lib/firebase-admin";
import { EventTypeBadge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ "event-id": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const event = await getEventAdmin(eventId);
  return { title: event?.title ?? "Event" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatEventDates(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const startFormatted = formatDate(startStr);

  if (startStr === endStr) {
    return `${startFormatted}, ${start.getFullYear()}`;
  }

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startFormatted}, ${start.getFullYear()} - ${formatDate(endStr)}, ${end.getFullYear()}`;
  }

  return `${startFormatted} - ${formatDate(endStr)}, ${start.getFullYear()}`;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const [event, responseCount, questionsCountSnap] = await Promise.all([
    getEventAdmin(eventId),
    getResponseCountAdmin(eventId),
    adminDb
      .collection("events")
      .doc(eventId)
      .collection("questions")
      .count()
      .get(),
  ]);

  if (!event) notFound();

  const questionCount = questionsCountSnap.data().count;

  return (
    <div className="page-container animate-fade-slide-up">
      {/* Back nav */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          >
            All events
          </Button>
        </Link>
      </div>

      {/* Event header */}
      <Card padding="lg" style={{ marginBottom: "24px" }}>
        <header>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
            <EventTypeBadge type={event.event_type} />
            <span style={{ color: "var(--color-outline)", fontSize: "0.875rem" }}>
              {formatEventDates(event.start_date, event.end_date)}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
            {event.title}
          </h1>
          {event.description && (
            <p style={{ color: "var(--color-outline)", margin: 0, fontSize: "0.9375rem" }}>
              {event.description}
            </p>
          )}
        </header>
      </Card>

      {/* Stats row (Bento Style) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Responses Stat */}
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span className="label-caps" style={{ color: "var(--color-outline)" }}>
              Responses
            </span>
            <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>
              groups
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--color-primary)", lineHeight: 1 }}>
              {responseCount ?? 0}
            </span>
            <span style={{ color: "var(--color-outline)", fontSize: "0.875rem" }}>
              total
            </span>
          </div>
        </Card>

        {/* Questions Stat */}
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span className="label-caps" style={{ color: "var(--color-outline)" }}>
              Questions
            </span>
            <span className="material-symbols-outlined" style={{ color: "var(--color-outline)" }}>
              help_center
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--color-on-surface)", lineHeight: 1 }}>
              {questionCount ?? 0}
            </span>
            <span style={{ color: "var(--color-outline)", fontSize: "0.875rem" }}>
              configured
            </span>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center", marginBottom: "24px" }}>
        <Link href={`/events/${eventId}/builder`} style={{ textDecoration: "none" }}>
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">edit_document</span>}
          >
            Questionnaire builder
          </Button>
        </Link>
        <Link href={`/events/${eventId}/responses`} style={{ textDecoration: "none" }}>
          <Button
            variant="secondary-light"
            leftIcon={<span className="material-symbols-outlined text-lg">table_chart</span>}
          >
            View responses
          </Button>
        </Link>
      </div>

      {/* Participant link card */}
      <Card padding="lg">
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-on-surface)", marginBottom: "6px" }}>
            Participant link
          </h2>
          <p style={{ color: "var(--color-outline)", fontSize: "0.875rem", margin: 0 }}>
            Share this unique link with participants to collect their feedback. Anyone with this link can submit a response.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "stretch" }}>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <input
              id="participant-link"
              className="input-glow"
              style={{
                width: "100%",
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--color-on-surface)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.875rem",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                outline: "none",
                transition: "border-color var(--transition-base)",
              }}
              readOnly
              type="text"
              value={`https://csa-feedback.vercel.app/respond/${eventId}`}
            />
          </div>
          <ParticipantLinkCopy eventId={eventId} />
        </div>
      </Card>
    </div>
  );
}

// Client component just for the copy button (needs window.location)
function ParticipantLinkCopy({ eventId }: { eventId: string }) {
  const path = `/respond/${eventId}`;
  return (
    <CopyButton
      text={`${process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://csa-feedback.vercel.app")}${path}`}
      label="Copy link"
    />
  );
}

