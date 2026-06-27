import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin } from "@/lib/db-admin";
import { ParticipantForm } from "@/components/ParticipantForm";
import { EventTypeBadge } from "@/components/ui/Badge";
import type { Question } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{ "event-id": string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await props.params;
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

export default async function RespondPage(props: PageProps) {
  const { "event-id": eventId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  
  const cookieStore = await cookies();
  const isAdmin = cookieStore.has("__session");
  const isPreview = searchParams.preview === "true" || isAdmin;

  const [event, questions] = await Promise.all([
    getEventAdmin(eventId),
    getQuestionsAdmin(eventId),
  ]);

  if (!event) notFound();

  const isPublished = Boolean(event.is_published);

  if (!isPublished && !isPreview) {
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

        <main className="w-full max-w-3xl px-5 pt-12 flex flex-col gap-10 items-center justify-center my-auto">
          <Card padding="lg" className="stagger-in w-[calc(100%-32px)] md:w-full mx-auto text-center flex flex-col items-center gap-4" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(20px)" }}>
            <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center text-[var(--color-warning)] mb-2">
              <span className="material-symbols-outlined text-[36px]">unpublished</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", margin: 0, lineHeight: 1.25 }}>
              Feedback Form Unavailable
            </h1>
            <p className="text-[var(--color-text-secondary)] text-base font-medium max-w-md">
              The feedback form for <strong>{event.title}</strong> is currently not accepting responses. 
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Please contact the event administrator if you believe this is an error.
            </p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="secondary" size="md">
                  Go to home page
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const hasQuestions = questions && questions.length > 0;

  return (
    <div className="min-h-screen w-full bg-transparent text-[var(--color-text-primary)] relative overflow-x-hidden flex flex-col items-center">
      {isPreview && (
        <div className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] py-2 px-4 text-center text-sm font-medium z-[200] flex items-center justify-center gap-2 sticky top-0 shadow-md">
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          <span>Preview Mode — Responses will not be saved.</span>
        </div>
      )}
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
