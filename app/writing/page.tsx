"use client";

import { useState } from "react";

type WritingResult = {
  id: string;
  overall_score: number;
  grammar_feedback: string;
  vocabulary_feedback: string;
  improvement_suggestion: string;
};

export default function WritingPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WritingResult | null>(null);

  async function handleEvaluate() {
    setError(null);
    setResult(null);

    if (text.trim().length < 20) {
      setError("Tulisan minimal 20 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengevaluasi tulisan.");
      setResult(data.evaluation);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="font-mono text-xs tracking-widest text-writing uppercase mb-2">
          Writing Evaluation
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Tempel atau tulis
        </h1>
        <p className="text-ink-soft mt-2 max-w-xl">
          Minimal beberapa kalimat agar AI bisa menilai grammar, vocabulary
          dan struktur tulisan secara akurat.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Contoh: Last weekend, I went to my grandmother's house in the village..."
          className="w-full rounded-xl bg-transparent p-3 text-sm leading-relaxed resize-none placeholder:text-ink-soft/60"
        />
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-xs text-ink-soft">{text.trim().length} karakter</span>
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-writing text-paper text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Mengevaluasi..." : "Evaluate"}
          </button>
        </div>
      </section>

      {error && (
        <p className="text-sm text-speaking border-l-2 border-speaking pl-3">{error}</p>
      )}

      {result && (
        <section className="rounded-3xl border border-line bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Hasil Evaluasi</h2>
            <span className="grade-stamp text-2xl font-semibold text-writing">
              {result.overall_score}
              <span className="text-sm text-ink-soft">/100</span>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">
                Grammar
              </h3>
              <p className="text-sm leading-relaxed">{result.grammar_feedback}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">
                Vocabulary
              </h3>
              <p className="text-sm leading-relaxed">{result.vocabulary_feedback}</p>
            </div>
          </div>

          <div className="border-l-2 border-amber pl-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-amber mb-1">
              Saran Perbaikan
            </h3>
            <p className="text-sm leading-relaxed">{result.improvement_suggestion}</p>
          </div>
        </section>
      )}
    </div>
  );
}