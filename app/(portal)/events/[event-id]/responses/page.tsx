import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  SingleChoiceChart,
  MCQChart,
  ShortTextList,
} from "@/components/AnalyticsCharts";
import type {
  Question,
  Answer,
  SingleChoiceAnalytics,
  MCQAnalytics,
  ShortTextAnalytics,
} from "@/lib/types";

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
  return { title: `Responses — ${data?.title ?? "Event"}` };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single_choice: "Single choice",
  mcq: "Multiple choice",
  short_text: "Short text",
};

export default async function ResponsesPage({ params }: PageProps) {
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

  const { data: responses } = await supabase
    .from("responses")
    .select("id, submitted_at")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: true });

  const responseIds = (responses ?? []).map((r) => r.id);
  const responseCount = responseIds.length;

  // Fetch all answers for this event
  let answers: (Answer & { submitted_at: string })[] = [];
  if (responseIds.length > 0) {
    const { data: rawAnswers } = await supabase
      .from("answers")
      .select("*, responses(submitted_at)")
      .in("response_id", responseIds);

    answers = (rawAnswers ?? []).map((a) => {
      const row = a as unknown as Answer & { responses: { submitted_at: string } | null };
      return {
        ...row,
        submitted_at: row.responses?.submitted_at ?? "",
      };
    });
  }

  // Compute analytics per question
  function computeAnalytics(question: Question) {
    const qAnswers = answers.filter((a) => a.question_id === question.id);

    if (question.question_type === "single_choice") {
      const counts: Record<string, number> = {};
      (question.options ?? []).forEach((opt) => (counts[opt] = 0));
      qAnswers.forEach((a) => {
        const val = a.answer_value as string;
        if (val) counts[val] = (counts[val] ?? 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      })) as SingleChoiceAnalytics[];
    }

    if (question.question_type === "mcq") {
      const counts: Record<string, number> = {};
      (question.options ?? []).forEach((opt) => (counts[opt] = 0));
      qAnswers.forEach((a) => {
        const selected = a.answer_value as string[];
        (selected ?? []).forEach((opt) => {
          counts[opt] = (counts[opt] ?? 0) + 1;
        });
      });
      return Object.entries(counts).map(([option, count]) => ({
        option,
        count,
      })) as MCQAnalytics[];
    }

    // short_text — newest first
    return qAnswers
      .sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime()
      )
      .map((a) => ({
        text: a.answer_value as string,
        submitted_at: a.submitted_at,
      })) as ShortTextAnalytics[];
  }

  const firstResponse = responses?.[0];
  const lastResponse = responses?.[responses.length - 1];

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
        <ol style={{ display: "flex", alignItems: "center", gap: "6px", listStyle: "none", fontSize: "0.875rem" }}>
          <li>
            <Link href="/dashboard" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
              Events
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-text-muted)" }}>/</li>
          <li>
            <Link href={`/events/${eventId}`} style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
              {event.title}
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-text-muted)" }}>/</li>
          <li style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Responses</li>
        </ol>
      </nav>

      <h1 style={{ fontSize: "1.5rem", marginBottom: "28px" }}>Responses</h1>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <Card padding="md">
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 500 }}>
            Total responses
          </p>
          <p
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              color: responseCount > 0 ? "var(--color-accent)" : "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {responseCount}
          </p>
        </Card>

        {firstResponse && (
          <Card padding="md">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 500 }}>
              First response
            </p>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
              {formatDateTime(firstResponse.submitted_at)}
            </p>
          </Card>
        )}

        {lastResponse && lastResponse.id !== firstResponse?.id && (
          <Card padding="md">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 500 }}>
              Latest response
            </p>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
              {formatDateTime(lastResponse.submitted_at)}
            </p>
          </Card>
        )}
      </div>

      {/* No questions state */}
      {(!questions || questions.length === 0) && (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            No questions have been added to this event yet.{" "}
            <Link href={`/events/${eventId}/builder`} style={{ color: "var(--color-accent)" }}>
              Open the builder
            </Link>{" "}
            to add questions.
          </div>
        </Card>
      )}

      {/* No responses state */}
      {questions && questions.length > 0 && responseCount === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            No responses yet. Share the participant link to collect feedback.
          </div>
        </Card>
      )}

      {/* Per-question analytics */}
      {questions && questions.length > 0 && responseCount > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {(questions as Question[]).map((question, idx) => {
            const analyticsData = computeAnalytics(question);

            return (
              <Card key={question.id}>
                <CardHeader>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        paddingTop: "2px",
                      }}
                    >
                      Q{idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <CardTitle>{question.question_text}</CardTitle>
                    </div>
                    <Badge variant="default">
                      {QUESTION_TYPE_LABEL[question.question_type]}
                    </Badge>
                  </div>
                </CardHeader>

                {question.question_type === "single_choice" && (
                  <SingleChoiceChart
                    data={analyticsData as SingleChoiceAnalytics[]}
                    question={question}
                  />
                )}

                {question.question_type === "mcq" && (
                  <MCQChart
                    data={analyticsData as MCQAnalytics[]}
                    question={question}
                  />
                )}

                {question.question_type === "short_text" && (
                  <ShortTextList
                    data={analyticsData as ShortTextAnalytics[]}
                    question={question}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
