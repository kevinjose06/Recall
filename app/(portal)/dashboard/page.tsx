import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EventTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Event } from "@/lib/types";



function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventDates(startStr: string, endStr: string) {
  if (startStr === endStr) {
    return formatDate(startStr);
  }
  return `${formatDate(startStr)} — ${formatDate(endStr)}`;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResponsesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2h12v10H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 14l1.5-2h3L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


import { getAllEventsAdmin } from "@/lib/db-admin";

export default async function DashboardPage() {
  let events: unknown[] | null = null;

  try {
    events = await getAllEventsAdmin();
  } catch (error) {
    console.error("Dashboard fetch error:", error);
  }

  const eventList = (events ?? []) as (Event & {
    response_count?: number;
  })[];

  return (
    <div className="page-container">
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.625rem", marginBottom: "4px", color: "var(--color-on-surface)", letterSpacing: "-0.02em" }}>Events</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-outline)", margin: 0 }}>
            {eventList.length === 0
              ? "No events yet"
              : `${eventList.length} event${eventList.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link href="/events/new">
          <Button leftIcon={<PlusIcon />}>New event</Button>
        </Link>
      </div>

      {/* Events list */}
      {eventList.length === 0 ? (
        <Card>
          <EmptyState
            title="No events yet"
            description="Create your first event to start collecting participant feedback."
            action={
              <Link href="/events/new">
                <Button leftIcon={<PlusIcon />}>Create first event</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {eventList.map((event) => {
            const responseCount = event.response_count ?? 0;
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <Card interactive padding="md">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <EventTypeBadge type={event.event_type} />
                      </div>
                      <h2
                        style={{
                          fontSize: "1.0625rem",
                          fontWeight: 600,
                          color: "var(--color-on-surface)",
                          marginBottom: "6px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.title}
                      </h2>
                      {event.description && (
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-text-muted)",
                            margin: "0 0 8px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {event.description}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.8125rem",
                            color: "var(--color-outline)",
                          }}
                        >
                          <CalendarIcon />
                          {formatEventDates(event.start_date, event.end_date)}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.8125rem",
                            color:
                              responseCount > 0
                                ? "#4edea3"
                                : "var(--color-outline)",
                            fontWeight: responseCount > 0 ? 500 : 400,
                          }}
                        >
                          <ResponsesIcon />
                          {responseCount}{" "}
                          {responseCount === 1 ? "response" : "responses"}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <div
                      style={{
                        color: "var(--color-outline)",
                        flexShrink: 0,
                        paddingTop: "2px",
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

