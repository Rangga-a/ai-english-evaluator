import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq";
import { evaluateWithLLM } from "@/lib/openrouter";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`speaking:${ip}`, {
      limit: 3, 
      windowMs: 60_000, 
    });

    if (!limitResult.allowed) {
      const retryAfterSec = Math.ceil((limitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Coba lagi dalam ${retryAfterSec} detik.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "File audio tidak ditemukan" }, { status: 400 });
    }

    const maxSizeBytes = 4 * 1024 * 1024;
    if (audioFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Ukuran audio maksimal 4MB. Rekam lebih singkat (±30-45 detik)." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "audio-evaluations";

    const ext = audioFile.name.split(".").pop() || "webm";
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await audioFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: audioFile.type || "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json({ error: "Gagal mengunggah audio" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const audioUrl = publicUrlData.publicUrl;

    const transcript = await transcribeAudio(
      new Blob([arrayBuffer], { type: audioFile.type }),
      audioFile.name
    );

    if (!transcript || transcript.length < 5) {
      return NextResponse.json(
        { error: "Transcript terlalu pendek/kosong. Coba rekam ulang dengan suara lebih jelas." },
        { status: 400 }
      );
    }

    const result = await evaluateWithLLM("speaking", transcript);

    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        evaluation_type: "speaking",
        user_input: transcript,
        overall_score: result.overall_score,
        grammar_feedback: result.grammar_feedback,
        vocabulary_feedback: result.vocabulary_feedback,
        fluency_feedback: result.fluency_feedback || null,
        improvement_suggestion: result.improvement_suggestion,
        raw_result: result,
        audio_url: audioUrl,
        model_used: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Gagal menyimpan hasil evaluasi" }, { status: 500 });
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