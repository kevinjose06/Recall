export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin, getResponsesAndAnswersAdmin } from "@/lib/db-admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./responses.module.css";

interface PageProps {
  params: Promise<{ "event-id": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const event = await getEventAdmin(eventId);
  return { title: `Responses — ${event?.title ?? "Event"}` };
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

function accentStyle(color: string): CSSProperties & { "--accent-color": string } {
  return { "--accent-color": color };
}

export default async function ResponsesPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const [event, questions, responsesAndAnswers] = await Promise.all([
    getEventAdmin(eventId),
    getQuestionsAdmin(eventId),
    getResponsesAndAnswersAdmin(eventId),
  ]);

  if (!event) notFound();

  const { responses, answers } = responsesAndAnswers;

  const responseCount = responses.length;

  return (
    <div className="page-container animate-fade-slide-up">
      {/* Header Context */}
      <div style={{ marginBottom: "24px" }}>
        <Link href={`/events/${eventId}`} style={{ textDecoration: "none" }}>
          <Button
            variant="secondary-light"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
          >
            {event.title}
          </Button>
        </Link>
      </div>
      
      <Card padding="lg" style={{ marginBottom: "24px" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-on-surface)", marginBottom: "8px", lineHeight: 1.25 }}>
              Responses
            </h1>
            <p style={{ color: "var(--color-outline)", margin: 0, fontSize: "0.9375rem" }}>
              Analytics and feedback breakdown.
            </p>
          </div>
          <div className="text-left md:text-right">
            <span style={{ display: "block", fontSize: "3.5rem", fontWeight: 700, color: "var(--color-primary)", lineHeight: 1 }}>
              {responseCount}
            </span>
            <span className="label-caps" style={{ color: "var(--color-outline)", marginTop: "4px", display: "block" }}>
              Total Responses
            </span>
          </div>
        </div>
      </Card>

      {/* Per-question analytics bento grid */}
      <div className={styles.analyticsGrid}>
        {(!questions || questions.length === 0) && (
          <div className={styles.messageCard}>
            No questions configured yet.{" "}
            <Link href={`/events/${eventId}/builder`} className="text-[var(--color-primary)]">
              Open builder
            </Link>
          </div>
        )}

        {questions && questions.length > 0 && responseCount === 0 && (
          <div className={styles.messageCard}>
            No responses yet. Share the participant link to collect feedback.
          </div>
        )}

        {questions && questions.length > 0 && responseCount > 0 && (
          questions.map((question, idx) => {
            const qAnswers = answers.filter((a) => a.question_id === question.id);
            const indexMod = idx % 3;

            let colorHex = "#aec6ff"; // primary

            if (indexMod === 0) {
              colorHex = "#aec6ff";
            } else if (indexMod === 1) {
              colorHex = "#4edea3";
            } else {
              colorHex = "#ffb596";
            }

            // Donut Chart - Single Choice
            if (question.question_type === "single_choice") {
              const counts: Record<string, number> = {};
              const options = (question.options as string[]) ?? [];
              options.forEach((opt) => (counts[opt] = 0));
              qAnswers.forEach((a) => {
                const val = a.answer_value as string;
                if (val && counts[val] !== undefined) counts[val]++;
              });

              const total = qAnswers.length || 1;
              const segments: { name: string; percent: number; color: string }[] = [];
              const colors = ["#aec6ff", "#4edea3", "#ffb596", "#ffdad6", "#00a572"];

              options.forEach((opt, oIdx) => {
                const count = counts[opt] || 0;
                segments.push({
                  name: opt,
                  percent: Math.round((count / total) * 100),
                  color: colors[oIdx % colors.length],
                });
              });

              // Calculate dash offsets for SVG donut chart segments
              let accumulatedPercent = 0;
              const capturedPercent =
                responseCount > 0
                  ? Math.round((qAnswers.length / responseCount) * 100)
                  : 0;

              return (
                <section
                  key={question.id}
                  className={`${styles.questionCard} col-span-12 lg:col-span-6`}
                  style={accentStyle(colorHex)}
                >
                  <header className={styles.questionHeader}>
                    <div className={styles.questionMetaRow}>
                      <span className={styles.questionMeta}>
                        Q{idx + 1} • Single Choice
                      </span>
                    </div>
                    <h2 className={styles.questionTitle}>
                      {question.question_text}
                    </h2>
                  </header>

                  <div className={styles.singleChoiceBody}>
                    {/* SVG Donut */}
                    <div className={styles.donutWrap}>
                      <svg className={styles.donutSvg} viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          fill="transparent"
                          r="15.915"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="3.5"
                        ></circle>
                        {segments.map((seg, sIdx) => {
                          const strokeDash = `${seg.percent} 100`;
                          const strokeOffset = -accumulatedPercent;
                          accumulatedPercent += seg.percent;
                          if (seg.percent === 0) return null;
                          return (
                            <circle
                              key={sIdx}
                              className="donut-segment"
                              cx="18"
                              cy="18"
                              fill="transparent"
                              r="15.915"
                              stroke={seg.color}
                              strokeDasharray={strokeDash}
                              strokeDashoffset={strokeOffset}
                              strokeWidth="3.5"
                              style={{
                                transition: "stroke-dasharray 1.5s ease-out",
                              }}
                            ></circle>
                          );
                        })}
                      </svg>
                      <div className={styles.donutCenter}>
                        <span className={styles.donutValue}>
                          {capturedPercent}%
                        </span>
                        <span className={styles.donutLabel}>
                          Captured
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className={styles.legend}>
                      {segments.map((seg, sIdx) => (
                        <div key={sIdx} className={styles.legendItem}>
                          <div className={styles.legendLabel}>
                            <div className={styles.legendDot} style={{ backgroundColor: seg.color }}></div>
                            <span className={styles.legendText}>{seg.name}</span>
                          </div>
                          <span className={styles.legendValue}>{seg.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }

            // Bar Chart - Multiple Choice
            if (question.question_type === "mcq") {
              const counts: Record<string, number> = {};
              const options = (question.options as string[]) ?? [];
              options.forEach((opt) => (counts[opt] = 0));

              qAnswers.forEach((a) => {
                const selected = a.answer_value as string[];
                (selected ?? []).forEach((opt) => {
                  if (counts[opt] !== undefined) counts[opt]++;
                });
              });

              const total = qAnswers.length || 1;
              const barData = options.map((opt) => {
                const count = counts[opt] || 0;
                const percent = Math.round((count / total) * 100);
                return { name: opt, count, percent };
              });

              return (
                <section
                  key={question.id}
                  className={`${styles.questionCard} col-span-12 lg:col-span-6`}
                  style={accentStyle(colorHex)}
                >
                  <header className={styles.questionHeader}>
                    <div className={styles.questionMetaRow}>
                      <span className={styles.questionMeta}>
                        Q{idx + 1} • Multiple Choice
                      </span>
                      <span className={styles.questionHint}>
                        Respondents may select multiple
                      </span>
                    </div>
                    <h2 className={styles.questionTitle}>
                      {question.question_text}
                    </h2>
                  </header>

                  <div className={styles.barList}>
                    {barData.map((data, bIdx) => (
                      <div key={bIdx} className={styles.barItem}>
                        <div className={styles.barRow}>
                          <span className={styles.barName}>{data.name}</span>
                          <span className={styles.barValue}>
                            {data.count}
                            <span>({data.percent}%)</span>
                          </span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${data.percent}%`,
                              backgroundColor: colorHex,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            // Bar Chart - Star Rating
            if (question.question_type === "star_rating") {
              const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              const ratingAnswers = qAnswers
                .map((answer) => {
                  const value = answer.answer_value;
                  const rating = typeof value === "number" ? value : Number(value);
                  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
                })
                .filter((rating): rating is number => rating !== null);

              ratingAnswers.forEach((rating) => {
                counts[rating]++;
              });

              const total = ratingAnswers.length || 1;
              const average =
                ratingAnswers.length > 0
                  ? ratingAnswers.reduce((sum, rating) => sum + rating, 0) / ratingAnswers.length
                  : 0;
              const ratingData = [5, 4, 3, 2, 1].map((rating) => {
                const count = counts[rating] || 0;
                const percent = Math.round((count / total) * 100);
                return { rating, count, percent };
              });

              return (
                <section
                  key={question.id}
                  className={`${styles.questionCard} col-span-12 lg:col-span-6`}
                  style={accentStyle(colorHex)}
                >
                  <header className={styles.questionHeader}>
                    <div className={styles.questionMetaRow}>
                      <span className={styles.questionMeta}>
                        Q{idx + 1} â€¢ Star Rating
                      </span>
                      <span className={styles.questionHint}>
                        Average {average.toFixed(1)} / 5
                      </span>
                    </div>
                    <h2 className={styles.questionTitle}>
                      {question.question_text}
                    </h2>
                  </header>

                  <div className={styles.barList}>
                    {ratingData.map((data) => (
                      <div key={data.rating} className={styles.barItem}>
                        <div className={styles.barRow}>
                          <span className={styles.ratingLabel}>
                            <span className={styles.ratingStars} aria-hidden="true">
                              {Array.from({ length: data.rating }).map((_, starIdx) => (
                                <span key={starIdx} className="material-symbols-outlined">
                                  star
                                </span>
                              ))}
                            </span>
                            <span>{data.rating}</span>
                          </span>
                          <span className={styles.barValue}>
                            {data.count}
                            <span>({data.percent}%)</span>
                          </span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${data.percent}%`,
                              backgroundColor: colorHex,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            // Scrollable List - Short Text
            const textResponses = qAnswers
              .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
              .map((a) => ({
                text: a.answer_value as string,
                submitted_at: a.submitted_at,
              }));

            return (
              <section
                key={question.id}
                className={`${styles.questionCard} col-span-12`}
                style={accentStyle(colorHex)}
              >
                <header className={styles.questionHeader}>
                  <div className={styles.questionMetaRow}>
                    <span className={styles.questionMeta}>
                      Q{idx + 1} • Short Text
                    </span>
                  </div>
                  <h2 className={styles.questionTitle}>
                    {question.question_text}
                  </h2>
                </header>

                <div className={styles.textList} style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {textResponses.map((tr, trIdx) => (
                    <div
                      key={trIdx}
                      className={styles.textResponse}
                    >
                      <p className={styles.textResponseCopy}>
                        &quot;{tr.text}&quot;
                      </p>
                      <span className={styles.textResponseTime}>
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatDateTime(tr.submitted_at)}
                      </span>
                    </div>
                  ))}
                  {textResponses.length === 0 && (
                    <div className={styles.emptyText}>
                      No answers submitted.
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>

    </div>
  );
}
