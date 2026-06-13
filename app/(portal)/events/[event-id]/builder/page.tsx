import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionnaireBuilder } from "@/components/QuestionnaireBuilder";
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
  return { title: `Builder — ${data?.title ?? "Event"}` };
}

export default async function BuilderPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  // Check if any responses exist — if so, lock the builder
  const { count: responseCount } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const isLocked = (responseCount ?? 0) > 0;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 md:py-12 animate-fade-slide-up pb-32">
      {/* Header Section with Breadcrumb */}
      <div className="mb-8">
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
        <h1 className="font-display-lg text-display-lg font-bold text-[var(--color-text-primary)] leading-tight tracking-tight mb-2">
          Questionnaire builder
        </h1>
        <p className="font-body-lg text-[var(--color-text-secondary)]">
          {isLocked
            ? "This questionnaire is locked because responses have been submitted."
            : "Add questions, set options, and reorder by dragging. Save when ready."}
        </p>
      </div>

      <QuestionnaireBuilder
        eventId={eventId}
        initialQuestions={(questions ?? []) as Question[]}
        isLocked={isLocked}
      />
    </div>
  );
}

