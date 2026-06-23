import type { Question } from "./types";

export type SignatureQuestion = Pick<
  Question,
  "question_text" | "question_type" | "options" | "is_required"
>;

function hashString(value: string) {
  let hash = 5381;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }

  return (hash >>> 0).toString(36);
}

export function getQuestionnaireSignature(questions: SignatureQuestion[]) {
  const normalized = questions.map((question, index) => ({
    index,
    question_text: question.question_text.trim(),
    question_type: question.question_type,
    options: (question.options ?? []).map((option) => option.trim()),
    is_required: question.is_required ?? false,
  }));

  return hashString(JSON.stringify(normalized));
}
