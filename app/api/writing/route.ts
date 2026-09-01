import { NextRequest, NextResponse } from "next/server";
import { evaluateWithLLM } from "@/lib/openrouter";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const maxDuration = 60;

const MAX_TEXT_LENGTH = 3000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`writing:${ip}`, {
      limit: 5,
      windowMs: 60_000, 
    });

    if (!limitResult.allowed) {
      const retryAfterSec = Math.ceil((limitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Coba lagi dalam ${retryAfterSec} detik.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body = await req.json();
    const text = (body.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
    }
    if (text.length < 20) {
      return NextResponse.json(
        { error: "Tulisan terlalu pendek, minimal 20 karakter" },
        { status: 400 }
      );
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Tulisan terlalu panjang, maksimal ${MAX_TEXT_LENGTH} karakter` },
        { status: 400 }
      );
    }

    const result = await evaluateWithLLM("writing", text);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        evaluation_type: "writing",
        user_input: text,
        overall_score: result.overall_score,
        grammar_feedback: result.grammar_feedback,
        vocabulary_feedback: result.vocabulary_feedback,
        fluency_feedback: null,
        improvement_suggestion: result.improvement_suggestion,
        raw_result: result,
        model_used: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Gagal menyimpan hasil evaluasi ke database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ evaluation: data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}