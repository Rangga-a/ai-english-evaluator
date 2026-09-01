import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); 

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("evaluations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (type === "writing" || type === "speaking") {
      query = query.eq("evaluation_type", type);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Gagal mengambil riwayat evaluasi" }, { status: 500 });
    }

    return NextResponse.json({ evaluations: data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 });
  }
}