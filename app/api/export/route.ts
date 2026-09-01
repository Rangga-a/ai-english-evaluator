import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const maxDuration = 60;

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("evaluations")
      .select("*")
      .order("created_at", { ascending: false });

    if (type === "writing" || type === "speaking") {
      query = query.eq("evaluation_type", type);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
    }

    const headers = [
      "id", "evaluation_type", "user_input", "overall_score",
      "grammar_feedback", "vocabulary_feedback", "fluency_feedback",
      "improvement_suggestion", "model_used", "created_at",
    ];

    const rows = (data || []).map((row) =>
      headers.map((h) => csvEscape((row as any)[h])).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evaluations-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 });
  }
}