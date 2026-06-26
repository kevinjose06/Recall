export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin, getResponsesAndAnswersAdmin } from "@/lib/db-admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { AnswerValue, Question, Response } from "@/lib/types";
import { ResponsesToolbar } from "./ResponsesToolbar";
import styles from "./responses.module.css";

interface PageProps {
  params: Promise<{ "event-id": string }>;
  searchParams?: Promise<{
    view?: string;
    question?: string;
    response?: string;
  }>;
}

type ViewMode = "summary" | "question" | "individual";
type JoinedAnswer = Awaited<ReturnType<typeof getResponsesAndAnswersAdmin>>["answers"][number];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "event-id": eventId } = await params;
  const event = await getEventAdmin(eventId);
  return { title: `Responses — ${event?.title ?? "Event"}` };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
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

function getViewMode(value?: string): ViewMode {
  if (value === "question" || value === "individual") return value;
  return "summary";
}

function getQuestionTypeLabel(type: Question["question_type"]) {
  switch (type) {
    case "single_choice":
      return "Single Choice";
    case "mcq":
      return "Multiple Choice";
    case "star_rating":
      return "Star Rating";
    case "short_text":
      return "Short Text";
  }
}

function formatAnswerValue(value: AnswerValue | undefined, questionType?: Question["question_type"]) {
  if (value === undefined) return "No answer";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "No answer";
  if (questionType === "star_rating") return `${value} / 5`;
  return String(value).trim() || "No answer";
}

function getAnswerMap(answers: JoinedAnswer[]) {
  const answerMap = new Map<string, JoinedAnswer>();

  answers.forEach((answer) => {
    answerMap.set(`${answer.response_id}:${answer.question_id}`, answer);
  });

  return answerMap;
}

function isNameQuestion(question: Question) {
  return /\b(full\s*)?name\b/i.test(question.question_text);
}

function getRespondentLabel(
  response: Response,
  responses: Response[],
  questions: Question[] = [],
  answers: JoinedAnswer[] = []
) {
  const storedName = response.respondent_name ?? response.name;

  if (storedName?.trim()) {
    return storedName.trim();
  }

  const answerMap = getAnswerMap(answers);
  const nameQuestion = questions.find(isNameQuestion);
  const nameAnswer = nameQuestion
    ? answerMap.get(`${response.id}:${nameQuestion.id}`)?.answer_value
    : undefined;

  if (typeof nameAnswer === "string" && nameAnswer.trim()) {
    return nameAnswer.trim();
  }

  const index = responses.findIndex((item) => item.id === response.id);
  return `Anonymous ${index >= 0 ? index + 1 : ""}`.trim();
}

function QuestionResponseView({
  question,
  questionIndex,
  questions,
  responses,
  answers,
  prevUrl,
  nextUrl,
}: {
  question: Question | undefined;
  questionIndex: number;
  questions: Question[];
  responses: Response[];
  answers: JoinedAnswer[];
  prevUrl: string | null;
  nextUrl: string | null;
}) {
  if (!question) {
    return (
      <div className={styles.messageCard}>
        No question selected.
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className={styles.messageCard}>
        No responses yet. Share the participant link to collect feedback.
      </div>
    );
  }

  const answerMap = getAnswerMap(answers);

  return (
    <section className={styles.detailPanel} style={accentStyle("#aec6ff")}>
      <header className={styles.questionHeader}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", width: "100%", marginBottom: "4px" }}>
          <div className={styles.questionMetaRow}>
            <span className={styles.questionMeta}>
              Q{questionIndex + 1} - {getQuestionTypeLabel(question.question_type)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {prevUrl ? (
              <Link href={prevUrl} tabIndex={-1}>
                <button type="button" className={styles.navButton}>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  <span>Prev</span>
                </button>
              </Link>
            ) : (
              <button type="button" className={styles.navButton} disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                <span>Prev</span>
              </button>
            )}
            {nextUrl ? (
              <Link href={nextUrl} tabIndex={-1}>
                <button type="button" className={styles.navButton}>
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </Link>
            ) : (
              <button type="button" className={styles.navButton} disabled>
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            )}
          </div>
        </div>
        <h2 className={styles.questionTitle}>{question.question_text}</h2>
      </header>

      <div className={styles.answerList}>
        {responses.map((response) => {
          const answer = answerMap.get(`${response.id}:${question.id}`);

          return (
            <article key={response.id} className={styles.answerItem}>
              <div className={styles.answerHeader}>
                <span className={styles.answerRespondent}>
                  {getRespondentLabel(response, responses, questions, answers)}
                </span>
                <span className={styles.answerTime}>
                  {formatDateTime(response.submitted_at)}
                </span>
              </div>
              <p className={styles.answerValue}>
                {formatAnswerValue(answer?.answer_value, question.question_type)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function IndividualResponseView({
  response,
  responses,
  questions,
  answers,
  prevUrl,
  nextUrl,
}: {
  response: Response | undefined;
  responses: Response[];
  questions: Question[];
  answers: JoinedAnswer[];
  prevUrl: string | null;
  nextUrl: string | null;
}) {
  if (!response) {
    return (
      <div className={styles.messageCard}>
        No respondent selected.
      </div>
    );
  }

  const answerMap = getAnswerMap(answers);

  return (
    <section className={styles.detailPanel} style={accentStyle("#4edea3")}>
      <header className={styles.questionHeader}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", width: "100%", marginBottom: "4px" }}>
          <div className={styles.questionMetaRow}>
            <span className={styles.questionMeta}>
              {getRespondentLabel(response, responses, questions, answers)}
            </span>
            <span className={styles.questionHint}>
              Submitted {formatDateTime(response.submitted_at)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {prevUrl ? (
              <Link href={prevUrl} tabIndex={-1}>
                <button type="button" className={styles.navButton}>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  <span>Prev</span>
                </button>
              </Link>
            ) : (
              <button type="button" className={styles.navButton} disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                <span>Prev</span>
              </button>
            )}
            {nextUrl ? (
              <Link href={nextUrl} tabIndex={-1}>
                <button type="button" className={styles.navButton}>
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </Link>
            ) : (
              <button type="button" className={styles.navButton} disabled>
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            )}
          </div>
        </div>
        <h2 className={styles.questionTitle}>Submitted answers</h2>
      </header>

      <div className={styles.answerList}>
        {questions.map((question, index) => {
          const answer = answerMap.get(`${response.id}:${question.id}`);

          return (
            <article key={question.id} className={styles.answerItem}>
              <div className={styles.answerHeader}>
                <span className={styles.answerRespondent}>
                  Q{index + 1} - {getQuestionTypeLabel(question.question_type)}
                </span>
              </div>
              <p className={styles.answerQuestion}>{question.question_text}</p>
              <p className={styles.answerValue}>
                {formatAnswerValue(answer?.answer_value, question.question_type)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function ResponsesPage({ params, searchParams }: PageProps) {
  const { "event-id": eventId } = await params;
  const resolvedSearchParams = await searchParams;

  const [event, questions, responsesAndAnswers] = await Promise.all([
    getEventAdmin(eventId),
    getQuestionsAdmin(eventId),
    getResponsesAndAnswersAdmin(eventId),
  ]);

  if (!event) notFound();

  const { responses, answers } = responsesAndAnswers;

  const responseCount = responses.length;
  const mode = getViewMode(resolvedSearchParams?.view);
  const selectedQuestionId =
    questions.find((question) => question.id === resolvedSearchParams?.question)?.id ??
    questions[0]?.id ??
    "";
  const selectedResponseId =
    responses.find((response) => response.id === resolvedSearchParams?.response)?.id ??
    responses[0]?.id ??
    "";
  const selectedQuestion = questions.find((question) => question.id === selectedQuestionId);
  const selectedQuestionIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === selectedQuestionId)
  );
  const selectedResponse = responses.find((response) => response.id === selectedResponseId);
  const selectedResponseIndex = Math.max(
    0,
    responses.findIndex((response) => response.id === selectedResponseId)
  );
  const responseOptions = responses.map((response) => ({
    id: response.id,
    label: getRespondentLabel(response, responses, questions, answers),
  }));

  const prevQuestionId = selectedQuestionIndex > 0 ? questions[selectedQuestionIndex - 1]?.id : null;
  const nextQuestionId = selectedQuestionIndex < questions.length - 1 ? questions[selectedQuestionIndex + 1]?.id : null;

  const prevResponseId = selectedResponseIndex > 0 ? responses[selectedResponseIndex - 1]?.id : null;
  const nextResponseId = selectedResponseIndex < responses.length - 1 ? responses[selectedResponseIndex + 1]?.id : null;

  return (
    <div className="page-container animate-fade-slide-up">
      <ResponsesToolbar
        eventId={eventId}
        eventTitle={event.title}
        mode={mode}
        questions={questions}
        responseOptions={responseOptions}
        selectedQuestionId={selectedQuestionId}
        selectedResponseId={selectedResponseId}
        responses={responses}
        answers={answers}
      />
      
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

      {mode === "summary" && (
        /* Per-question analytics bento grid */
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
                        Q{idx + 1} • Star Rating
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
      )}

      {mode === "question" && (
        <QuestionResponseView
          question={selectedQuestion}
          questionIndex={selectedQuestionIndex}
          questions={questions}
          responses={responses}
          answers={answers}
          prevUrl={prevQuestionId ? `?view=question&question=${prevQuestionId}` : null}
          nextUrl={nextQuestionId ? `?view=question&question=${nextQuestionId}` : null}
        />
      )}

      {mode === "individual" && (
        <IndividualResponseView
          response={selectedResponse}
          responses={responses}
          questions={questions}
          answers={answers}
          prevUrl={prevResponseId ? `?view=individual&response=${prevResponseId}` : null}
          nextUrl={nextResponseId ? `?view=individual&response=${nextResponseId}` : null}
        />
      )}

    </div>
  );
}
