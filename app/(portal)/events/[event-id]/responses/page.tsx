import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventAdmin, getQuestionsAdmin, getResponsesAndAnswersAdmin } from "@/lib/db-admin";
import type { Question, Answer } from "@/lib/types";

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

export default async function ResponsesPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const event = await getEventAdmin(eventId);
  if (!event) notFound();

  const questions = await getQuestionsAdmin(eventId);
  const { responses, answers } = await getResponsesAndAnswersAdmin(eventId);

  const responseCount = responses.length;

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 md:py-12 animate-fade-slide-up">
      {/* Header Context */}
      <header className="flex flex-col gap-4 mb-8">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#002e6b] px-4 py-1.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] relative overflow-hidden transition-all duration-300 hover:text-[#001a43] hover:border-[#c1d6ff] border border-transparent w-fit group"
          style={{ position: "relative" }}
        >
          <span
            className="absolute inset-0 bg-[#c1d6ff] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left scale-x-0 group-hover:scale-x-100"
            style={{ zIndex: 1 }}
          />
          <span className="material-symbols-outlined text-sm relative" style={{ zIndex: 2 }}>
            arrow_back
          </span>
          <span className="relative" style={{ zIndex: 2 }}>{event.title}</span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-[var(--color-text-primary)] mb-2">
              Responses
            </h1>
            <p className="font-body-sm text-[var(--color-text-secondary)]">
              Analytics and feedback breakdown.
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className="block font-display-lg text-display-lg text-[var(--color-secondary)] mb-1 font-bold text-[64px] leading-none">
              {responseCount}
            </span>
            <span className="font-label-caps text-label-caps text-[var(--color-text-secondary)] uppercase tracking-widest text-[12px]">
              Total Responses
            </span>
          </div>
        </div>
      </header>

      {/* Per-question analytics bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {(!questions || questions.length === 0) && (
          <div className="glass-panel rounded-lg p-6 lg:col-span-12 text-center text-[var(--color-text-secondary)]">
            No questions configured yet.{" "}
            <Link href={`/events/${eventId}/builder`} className="text-[var(--color-primary)]">
              Open builder
            </Link>
          </div>
        )}

        {questions && questions.length > 0 && responseCount === 0 && (
          <div className="glass-panel rounded-lg p-6 lg:col-span-12 text-center text-[var(--color-text-secondary)]">
            No responses yet. Share the participant link to collect feedback.
          </div>
        )}

        {questions && questions.length > 0 && responseCount > 0 && (
          questions.map((question, idx) => {
            const qAnswers = answers.filter((a) => a.question_id === question.id);
            const indexMod = idx % 3;

            // Define left-accent stripe borders based on modulo
            let accentBorderClass = "";
            let accentBgHover = "";
            let colorHex = "#aec6ff"; // primary

            if (indexMod === 0) {
              accentBorderClass = "bg-[var(--color-primary)]/20 group-hover:bg-[var(--color-primary)]";
              accentBgHover = "hover:border-[var(--color-primary)]/20";
              colorHex = "#aec6ff";
            } else if (indexMod === 1) {
              accentBorderClass = "bg-[var(--color-secondary)]/20 group-hover:bg-[var(--color-secondary)]";
              accentBgHover = "hover:border-[var(--color-secondary)]/20";
              colorHex = "#4edea3";
            } else {
              accentBorderClass = "bg-[var(--color-tertiary)]/20 group-hover:bg-[var(--color-tertiary)]";
              accentBgHover = "hover:border-[var(--color-tertiary)]/20";
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

              return (
                <section
                  key={question.id}
                  className={`glass-panel p-6 lg:col-span-5 flex flex-col gap-6 relative group overflow-hidden transition-all duration-300 rounded-lg ${accentBgHover}`}
                >
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${accentBorderClass}`}></div>
                  <header>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[var(--color-bg-highest)] px-2 py-1 rounded text-[10px] font-label-caps text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Q{idx + 1} • Single Choice
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-[var(--color-text-primary)]">
                      {question.question_text}
                    </h2>
                  </header>

                  <div className="flex flex-col md:flex-row items-center gap-8 justify-center flex-1">
                    {/* SVG Donut */}
                    <div className="relative w-40 h-40 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
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
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="font-headline-md text-headline-md font-bold text-[var(--color-text-primary)]">
                          100%
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest">
                          Captured
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-3 font-body-sm text-sm w-full md:w-auto flex-1">
                      {segments.map((seg, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></div>
                            <span className="text-[var(--color-text-secondary)] line-clamp-1">{seg.name}</span>
                          </div>
                          <span className="text-[var(--color-text-primary)] font-mono font-medium">{seg.percent}%</span>
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
                  className={`glass-panel p-6 lg:col-span-7 flex flex-col gap-6 relative group transition-all duration-300 rounded-lg ${accentBgHover}`}
                >
                  <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${accentBorderClass}`}></div>
                  <header>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="bg-[var(--color-bg-highest)] px-2 py-1 rounded text-[10px] font-label-caps text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Q{idx + 1} • Multiple Choice
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] border border-white/10 px-2 py-0.5 rounded">
                        Respondents may select multiple
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-[var(--color-text-primary)]">
                      {question.question_text}
                    </h2>
                  </header>

                  <div className="flex flex-col gap-4 justify-center flex-1">
                    {barData.map((data, bIdx) => (
                      <div key={bIdx} className="flex flex-col gap-1.5">
                        <div className="flex justify-between font-body-sm text-sm">
                          <span className="text-[var(--color-text-secondary)]">{data.name}</span>
                          <span className="font-mono text-[var(--color-text-primary)]">{data.count}</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--color-bg-highest)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
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
                className={`glass-panel p-6 lg:col-span-12 flex flex-col gap-6 relative group h-[400px] transition-all duration-300 rounded-lg ${accentBgHover}`}
              >
                <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${accentBorderClass}`}></div>
                <header className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[var(--color-bg-highest)] px-2 py-1 rounded text-[10px] font-label-caps text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Q{idx + 1} • Short Text
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-[var(--color-text-primary)]">
                    {question.question_text}
                  </h2>
                </header>

                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                  {textResponses.map((tr, trIdx) => (
                    <div
                      key={trIdx}
                      className="bg-[var(--color-bg-lowest)] border border-white/5 p-4 rounded-lg flex flex-col gap-2 hover:bg-[var(--color-bg-subtle)] transition-colors"
                    >
                      <p className="font-body-sm text-sm text-[var(--color-text-primary)]">
                        &quot;{tr.text}&quot;
                      </p>
                      <span className="font-label-caps text-[10px] text-[var(--color-text-secondary)]/60 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatDateTime(tr.submitted_at)}
                      </span>
                    </div>
                  ))}
                  {textResponses.length === 0 && (
                    <div className="text-center text-[var(--color-text-secondary)] py-8">
                      No answers submitted.
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>

      <style jsx global>{`
        /* Custom scrollbar for text responses */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

