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



export default async function BuilderPage({ params }: PageProps) {
  const { "event-id": eventId } = await params;

  const [event, questions, responseCount] = await Promise.all([
    getEventAdmin(eventId),
    getQuestionsAdmin(eventId),
    getResponseCountAdmin(eventId),
  ]);

  if (!event) notFound();

  const isLocked = responseCount > 0;

  return (
    <div className="page-container pb-32">
      <QuestionnaireBuilder
        eventId={eventId}
        eventTitle={event.title}
        initialQuestions={questions}
        isLocked={isLocked}
      />
    </div>
  );
}

