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
    <div className="page-container">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
        <ol
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            listStyle: "none",
            fontSize: "0.875rem",
          }}
        >
          <li>
            <Link href="/dashboard" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
              Events
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-text-muted)" }}>/</li>
          <li>
            <Link
              href={`/events/${eventId}`}
              style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
            >
              {event.title}
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-text-muted)" }}>/</li>
          <li style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
            Builder
          </li>
        </ol>
      </nav>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "6px" }}>
          Questionnaire builder
        </h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
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
