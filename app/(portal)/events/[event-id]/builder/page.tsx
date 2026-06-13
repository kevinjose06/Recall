import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin, getResponseCountAdmin } from "@/lib/db-admin";
import { QuestionnaireBuilder } from "@/components/QuestionnaireBuilder";
import { Card } from "@/components/ui/Card";
import type { Question } from "@/lib/types";

interface PageProps {
  params: Promise<{ "event-id": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const event = await getEventAdmin(eventId);
  return { title: `Builder — ${event?.title ?? "Event"}` };
}

export default async function BuilderPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const event = await getEventAdmin(eventId);

  if (!event) notFound();

  const questions = await getQuestionsAdmin(eventId);

  // Check if any responses exist — if so, lock the builder
  const responseCount = await getResponseCountAdmin(eventId);

  const isLocked = responseCount > 0;

  return (
    <div className="page-container pb-32">
      {/* Header Section with Breadcrumb */}
      <Card padding="lg" className="animate-fade-slide-up" style={{ marginBottom: "24px" }}>
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-label-caps text-label-caps mb-4">
          <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
            Events
          </Link>
          <span className="material-symbols-outlined text-[16px] select-none">chevron_right</span>
          <Link href={`/events/${eventId}`} className="hover:text-[var(--color-primary)] transition-colors">
            {event.title}
          </Link>
          <span className="material-symbols-outlined text-[16px] select-none">chevron_right</span>
          <span className="text-[var(--color-text-primary)]">Builder</span>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
          Questionnaire builder
        </h1>
        <p style={{ color: "var(--color-outline)", margin: 0, fontSize: "0.9375rem" }}>
          {isLocked
            ? "This questionnaire is locked because responses have been submitted."
            : "Add questions, set options, and reorder by dragging. Save when ready."}
        </p>
      </Card>

      <QuestionnaireBuilder
        eventId={eventId}
        initialQuestions={questions}
        isLocked={isLocked}
      />
    </div>
  );
}

