import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin } from "@/lib/db-admin";
import { ParticipantForm } from "@/components/ParticipantForm";
import { EventTypeBadge } from "@/components/ui/Badge";
import type { Question } from "@/lib/types";

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
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] relative overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 left-0 w-full z-50 flex items-center gap-3 px-6 h-16 bg-[var(--color-bg-surface)]/50 backdrop-blur-xl border-b border-white/10">
        <img
          src="/csa-logo.png?v=2"
          alt="CSA logo"
          width={22}
          height={22}
          className="logo-adaptive object-contain"
        />
        <span className="font-body-sm text-sm font-semibold text-[var(--color-text-secondary)]">
          CSA Recall · RIT Kottayam
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-5 py-8 md:py-12 flex flex-col">
        {/* Event Info Header */}
        <header className="mb-8 stagger-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <EventTypeBadge type={event.event_type} />
            <span className="font-body-sm text-sm text-[var(--color-text-secondary)]">
              {formatEventDates(event.start_date, event.end_date)}
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg font-bold text-[var(--color-text-primary)] leading-tight tracking-tight mb-2">
            {event.title}
          </h1>
          {event.description && (
            <p className="font-body-lg text-[var(--color-text-secondary)]">
              {event.description}
            </p>
          )}
        </header>

        {/* No questions */}
        {!hasQuestions && (
          <div className="glass-panel rounded-lg p-8 text-center stagger-in" style={{ animationDelay: "0.2s" }}>
            <p className="font-body-sm text-sm text-[var(--color-text-secondary)] margin-0">
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
      </main>
    </div>
  );
}

