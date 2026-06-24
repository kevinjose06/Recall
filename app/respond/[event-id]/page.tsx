import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin } from "@/lib/db-admin";
import { ParticipantForm } from "@/components/ParticipantForm";
import { EventTypeBadge } from "@/components/ui/Badge";
import type { Question } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface PageProps {
  params: Promise<{ "event-id": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const event = await getEventAdmin(eventId);
  return {
    title: event?.title ? `Feedback — ${event.title}` : "Event Feedback",
    description: event?.title
      ? `Submit your feedback for ${event.title} — a CSA event at RIT Kottayam.`
      : "Submit event feedback.",
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatEventDates(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const startFormatted = formatDate(startStr);

  if (startStr === endStr) {
    return `${startFormatted}, ${start.getFullYear()}`;
  }
  return `${startFormatted} - ${formatDate(endStr)}, ${start.getFullYear()}`;
}

export default async function RespondPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const [event, questions] = await Promise.all([
    getEventAdmin(eventId),
    getQuestionsAdmin(eventId),
  ]);

  if (!event) notFound();

  const hasQuestions = questions && questions.length > 0;

  return (
    <div className="min-h-screen w-full bg-transparent text-[var(--color-text-primary)] relative overflow-x-hidden flex flex-col items-center">
      {/* Top Header Bar matching the Builder/Admin styling */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          height: "72px",
          minHeight: "72px",
          backgroundColor: "transparent",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <img
            src="/csa-logo.png?v=2"
            alt="CSA logo"
            width={36}
            height={36}
            style={{
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 1,
            }}
          />
          <span
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#e5e2e1",
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Recall
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl px-5 pb-32 flex flex-col gap-10 items-center">
        {/* Event Info Header Card matching the Builder banner style */}
        <Card padding="lg" className="stagger-in w-[calc(100%-32px)] md:w-full mx-auto" style={{ animationDelay: "0.1s", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
            {event.title} - Feedback form
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium mt-2">
            {formatEventDates(event.start_date, event.end_date)}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium mt-2">
            Thank you for participating in {event.title}. We&apos;d love to hear your feedback!
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 text-sm text-[var(--color-error)] font-medium">
            * Indicates required question
          </div>
        </Card>

        {/* No questions */}
        {!hasQuestions && (
          <Card padding="lg" className="text-center stagger-in w-[calc(100%-32px)] md:w-full mx-auto" style={{ animationDelay: "0.2s" }}>
            <p className="font-body-sm text-sm text-[var(--color-text-secondary)] margin-0">
              The feedback form for this event hasn&apos;t been set up yet. Please check back later.
            </p>
          </Card>
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
      </main>
    </div>
  );
}
