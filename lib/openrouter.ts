export type EvaluationType = "writing" | "speaking";

export type LLMEvaluationResult = {
  overall_score: number;
  grammar_feedback: string;
  vocabulary_feedback: string;
  fluency_feedback?: string;
  improvement_suggestion: string;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildSystemPrompt(type: EvaluationType): string {
  const baseRules = `Balas HANYA dengan objek JSON valid, tanpa markdown, tanpa teks tambahan apa pun di luar JSON. Semua feedback ditulis dalam Bahasa Indonesia yang jelas dan membangun.`;

  if (type === "writing") {
    return `Kamu adalah penguji Bahasa Inggris (writing examiner) yang tegas tapi adil, setara level guru IELTS/TOEFL.
Evaluasi tulisan user berdasarkan grammar, vocabulary, struktur kalimat, dan koherensi.

Format JSON WAJIB persis seperti ini:
{
  "overall_score": number (0-100),
  "grammar_feedback": string,
  "vocabulary_feedback": string,
  "improvement_suggestion": string
}

${baseRules}`;
  }

  return `Kamu adalah penguji Bahasa Inggris (speaking examiner) yang tegas tapi adil.
Kamu akan menerima TRANSCRIPT hasil speech-to-text dari rekaman suara user.
Evaluasi berdasarkan grammar, fluency (kelancaran & alur bicara berdasarkan transcript), vocabulary, dan koherensi.

Format JSON WAJIB persis seperti ini:
{
  "overall_score": number (0-100),
  "grammar_feedback": string,
  "fluency_feedback": string,
  "vocabulary_feedback": string,
  "improvement_suggestion": string
}

${baseRules}`;
}

function stripMarkdownFences(text: string): string {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

async function callOpenRouter(systemPrompt: string, userText: string, forceJsonMode: boolean) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum diset di .env.local");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "AI English Evaluator",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.3,
      ...(forceJsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return content;
}

export async function evaluateWithLLM(
  type: EvaluationType,
  userText: string
): Promise<LLMEvaluationResult> {
  const systemPrompt = buildSystemPrompt(type);

  let rawContent: string;
  let parsed: Partial<LLMEvaluationResult> = {};

  try {
    rawContent = await callOpenRouter(systemPrompt, userText, true);
    parsed = JSON.parse(stripMarkdownFences(rawContent));
  } catch {
    rawContent = await callOpenRouter(
      systemPrompt + "\n\nPENTING: keluaran HARUS JSON valid saja.",
      userText,
      false
    );
    try {
      parsed = JSON.parse(stripMarkdownFences(rawContent));
    } catch {
      throw new Error("Gagal parse hasil evaluasi dari LLM. Coba lagi.");
    }
  }

  return {
    overall_score: Number(parsed.overall_score) || 0,
    grammar_feedback: parsed.grammar_feedback || "-",
    vocabulary_feedback: parsed.vocabulary_feedback || "-",
    fluency_feedback: parsed.fluency_feedback,
    improvement_suggestion: parsed.improvement_suggestion || "-",
  };
}