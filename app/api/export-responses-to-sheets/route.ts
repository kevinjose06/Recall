import { createSign } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  getEventAdmin,
  getQuestionsAdmin,
  getResponsesAndAnswersAdmin,
} from "@/lib/db-admin";
import type { AnswerValue, Event, Question, Response } from "@/lib/types";

export const runtime = "nodejs";

const TARGET_EMAIL = "csa@rit.ac.in";
const GOOGLE_TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface JoinedAnswer {
  id: string;
  question_id: string;
  response_id: string;
  answer_value: AnswerValue;
  submitted_at: string;
}

interface SpreadsheetCreateResponse {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error("Google service account credentials are not configured.");
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as Partial<ServiceAccount>;

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Google service account credentials are incomplete.");
  }

  return serviceAccount as ServiceAccount;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(serviceAccount: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = toBase64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GOOGLE_SCOPES.join(" "),
      aud: serviceAccount.token_uri ?? GOOGLE_TOKEN_AUDIENCE,
      iat: now,
      exp: now + 3600,
    })
  );
  const unsignedToken = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = toBase64Url(signer.sign(serviceAccount.private_key));

  return `${unsignedToken}.${signature}`;
}

async function getGoogleAccessToken() {
  const serviceAccount = getServiceAccount();
  const response = await fetch(serviceAccount.token_uri ?? GOOGLE_TOKEN_AUDIENCE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(serviceAccount),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error("Google authentication failed.");
  }

  return payload.access_token as string;
}

async function googleJson<T>(url: string, token: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Google API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function formatAnswerValue(value: AnswerValue | undefined) {
  if (value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatQuestionType(type: Question["question_type"]) {
  switch (type) {
    case "single_choice":
      return "Single choice";
    case "mcq":
      return "Multiple choice";
    case "star_rating":
      return "Star rating";
    case "short_text":
      return "Short text";
  }
}

function isNameQuestion(question: Question) {
  return /\b(full\s*)?name\b/i.test(question.question_text);
}

function makeRespondentLabel(
  response: Response,
  responses: Response[],
  questions: Question[],
  answerByResponseAndQuestion: Map<string, JoinedAnswer>
) {
  const storedName = response.respondent_name ?? response.name;

  if (storedName?.trim()) {
    return storedName.trim();
  }

  const nameQuestion = questions.find(isNameQuestion);
  const nameAnswer = nameQuestion
    ? answerByResponseAndQuestion.get(`${response.id}:${nameQuestion.id}`)?.answer_value
    : undefined;

  if (typeof nameAnswer === "string" && nameAnswer.trim()) {
    return nameAnswer.trim();
  }

  const index = responses.findIndex((item) => item.id === response.id);
  return `Anonymous ${index + 1}`;
}

function formatTimestampForTitle(date: Date) {
  return date.toISOString().slice(0, 19).replace(/[T:]/g, "-");
}

function range(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'!A1`;
}

function buildSheetRows(
  event: Event,
  questions: Question[],
  responses: Response[],
  answers: JoinedAnswer[]
) {
  const answerByResponseAndQuestion = new Map<string, JoinedAnswer>();

  answers.forEach((answer) => {
    answerByResponseAndQuestion.set(
      `${answer.response_id}:${answer.question_id}`,
      answer
    );
  });

  const summaryRows = [
    ["Field", "Value"],
    ["Event title", event.title],
    ["Event type", event.event_type],
    ["Start date", event.start_date],
    ["End date", event.end_date],
    ["Created at", event.created_at ?? ""],
    ["Total responses", responses.length],
    ["Exported at", new Date().toISOString()],
    ["Shared with", TARGET_EMAIL],
  ];

  const questionRows = [
    ["Question #", "Question ID", "Question", "Type", "Required", "Options"],
    ...questions.map((question, index) => [
      index + 1,
      question.id,
      question.question_text,
      formatQuestionType(question.question_type),
      question.is_required ? "Yes" : "No",
      question.options?.join(", ") ?? "",
    ]),
  ];

  const responseRows = [
    [
      "Respondent name",
      "Response ID",
      "Submitted at",
      ...questions.map((question, index) => `Q${index + 1}: ${question.question_text}`),
    ],
    ...responses.map((response) => [
      makeRespondentLabel(response, responses, questions, answerByResponseAndQuestion),
      response.id,
      response.submitted_at,
      ...questions.map((question) =>
        formatAnswerValue(
          answerByResponseAndQuestion.get(`${response.id}:${question.id}`)
            ?.answer_value
        )
      ),
    ]),
  ];

  const questionAnswerRows = [
    ["Question #", "Question", "Type", "Respondent", "Response ID", "Submitted at", "Answer"],
    ...questions.flatMap((question, questionIndex) =>
      responses.map((response) => {
        const answer = answerByResponseAndQuestion.get(`${response.id}:${question.id}`);

        return [
          questionIndex + 1,
          question.question_text,
          formatQuestionType(question.question_type),
          makeRespondentLabel(response, responses, questions, answerByResponseAndQuestion),
          response.id,
          response.submitted_at,
          formatAnswerValue(answer?.answer_value),
        ];
      })
    ),
  ];

  return {
    summaryRows,
    questionRows,
    responseRows,
    questionAnswerRows,
  };
}

async function requireAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const cookieToken = request.cookies.get("__session")?.value ?? null;
  const token = bearerToken ?? cookieToken;

  if (!token) return false;

  try {
    await adminAuth.verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const isAuthenticated = await requireAuthenticatedUser(request);

  if (!isAuthenticated) {
    return NextResponse.json({ error: "You must be signed in to export responses." }, { status: 401 });
  }

  let body: { eventId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.eventId || typeof body.eventId !== "string") {
    return NextResponse.json({ error: "Missing event ID." }, { status: 400 });
  }

  try {
    const [event, questions, responsesAndAnswers] = await Promise.all([
      getEventAdmin(body.eventId),
      getQuestionsAdmin(body.eventId),
      getResponsesAndAnswersAdmin(body.eventId),
    ]);

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const { responses, answers } = responsesAndAnswers as {
      responses: Response[];
      answers: JoinedAnswer[];
    };
    const token = await getGoogleAccessToken();
    const title = `${event.title} feedback ${formatTimestampForTitle(new Date())}`;
    const spreadsheet = await googleJson<SpreadsheetCreateResponse>(
      "https://sheets.googleapis.com/v4/spreadsheets",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          properties: { title },
          sheets: [
            { properties: { title: "Summary" } },
            { properties: { title: "Responses" } },
            { properties: { title: "Questions" } },
            { properties: { title: "Question Answers" } },
          ],
        }),
      }
    );

    if (!spreadsheet.spreadsheetId) {
      throw new Error("Google Sheets did not return a spreadsheet ID.");
    }

    const rows = buildSheetRows(event, questions, responses, answers);

    await googleJson(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.spreadsheetId}/values:batchUpdate`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: [
            { range: range("Summary"), values: rows.summaryRows },
            { range: range("Responses"), values: rows.responseRows },
            { range: range("Questions"), values: rows.questionRows },
            { range: range("Question Answers"), values: rows.questionAnswerRows },
          ],
        }),
      }
    );

    await googleJson(
      `https://www.googleapis.com/drive/v3/files/${spreadsheet.spreadsheetId}/permissions?sendNotificationEmail=false`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          type: "user",
          role: "writer",
          emailAddress: TARGET_EMAIL,
        }),
      }
    );

    return NextResponse.json({
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl:
        spreadsheet.spreadsheetUrl ??
        `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`,
      sharedWith: TARGET_EMAIL,
    });
  } catch (error) {
    console.error("Sheets export failed:", error);
    return NextResponse.json(
      {
        error:
          "Failed to save responses to Google Sheets. Check the Google Sheets and Drive API access for the service account.",
      },
      { status: 500 }
    );
  }
}
