import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase env vars belum diset. Cek NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export type EvaluationRow = {
  id: string;
  evaluation_type: "writing" | "speaking";
  user_input: string;
  overall_score: number;
  grammar_feedback: string | null;
  vocabulary_feedback: string | null;
  fluency_feedback: string | null;
  improvement_suggestion: string | null;
  raw_result: unknown;
  audio_url: string | null;
  model_used: string | null;
  created_at: string;
};
