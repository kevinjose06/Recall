import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getResponseCountAdmin } from "@/lib/db-admin";
import { adminDb } from "@/lib/firebase-admin";
import { EventTypeBadge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";

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

  const event = await getEventAdmin(eventId);

  if (!event) notFound();

  const responseCount = await getResponseCountAdmin(eventId);

  // For questions count, we can do a simple count query on the subcollection
  const questionsCountSnap = await adminDb
    .collection("events")
    .doc(eventId)
    .collection("questions")
    .count()
    .get();
  
  const questionCount = questionsCountSnap.data().count;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:py-12 animate-fade-slide-up">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#002e6b] px-4 py-1.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] relative overflow-hidden transition-all duration-300 hover:text-[#001a43] hover:border-[#c1d6ff] border border-transparent mb-6 w-fit group"
        style={{ position: "relative" }}
      >
        <span
          className="absolute inset-0 bg-[#c1d6ff] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left scale-x-0 group-hover:scale-x-100"
          style={{ zIndex: 1 }}
        />
        <span className="material-symbols-outlined text-sm relative" style={{ zIndex: 2 }}>arrow_back</span>
        <span className="relative" style={{ zIndex: 2 }}>All events</span>
      </Link>

      {/* Event header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <EventTypeBadge type={event.event_type} />
          <span className="text-[var(--color-text-secondary)] font-body-sm text-sm">
            {formatEventDates(event.start_date, event.end_date)}
          </span>
        </div>
        <h1 className="font-display-lg text-display-lg font-bold text-[var(--color-text-primary)] leading-tight tracking-tight mb-2">
          {event.title}
        </h1>
        {event.description && (
          <p className="font-body-lg text-[var(--color-text-secondary)] max-w-2xl margin-0">
            {event.description}
          </p>
        )}
      </header>

      {/* Stats row (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Responses Stat */}
        <div className="glass-panel rounded-lg p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/20 transition-all duration-500"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps text-[var(--color-text-secondary)] uppercase tracking-widest">
              Responses
            </span>
            <span className="material-symbols-outlined text-[var(--color-primary)]">
              groups
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-[64px] leading-none font-bold text-[var(--color-primary)]">
              {responseCount ?? 0}
            </span>
            <span className="font-body-sm text-[var(--color-text-secondary)]">
              total
            </span>
          </div>
        </div>

        {/* Questions Stat */}
        <div className="glass-panel rounded-lg p-6 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps text-[var(--color-text-secondary)] uppercase tracking-widest">
              Questions
            </span>
            <span className="material-symbols-outlined text-[var(--color-text-secondary)]">
              help_center
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-[64px] leading-none font-bold text-[var(--color-text-primary)]">
              {questionCount ?? 0}
            </span>
            <span className="font-body-sm text-[var(--color-text-secondary)]">
              configured
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href={`/events/${eventId}/builder`}
          className="btn-primary-slide btn-hover-glow bg-[var(--color-primary)] text-[var(--color-on-primary-fixed-variant)] font-body-sm font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-lg">edit_document</span>
          Questionnaire builder
        </Link>
        <Link
          href={`/events/${eventId}/responses`}
          className="glass-panel hover:bg-white/5 btn-hover-glow text-[var(--color-text-primary)] font-body-sm py-3 px-6 rounded-full flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-lg">table_chart</span>
          View responses
        </Link>
      </div>

      {/* Participant link card */}
      <div className="glass-panel rounded-lg p-6 md:p-8">
        <div className="mb-6">
          <h2 className="font-headline-md text-headline-md text-[var(--color-text-primary)] mb-2">
            Participant link
          </h2>
          <p className="font-body-sm text-[var(--color-text-secondary)] max-w-2xl">
            Share this unique link with participants to collect their feedback. Anyone with this link can submit a response.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex-grow relative">
            <input
              id="participant-link"
              className="w-full bg-[var(--color-bg-lowest)] border border-white/10 text-[var(--color-text-primary)] font-mono text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-colors"
              readOnly
              type="text"
              value={`https://csa-feedback.vercel.app/respond/${eventId}`}
            />
          </div>
          <ParticipantLinkCopy eventId={eventId} />
        </div>
      </div>
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

