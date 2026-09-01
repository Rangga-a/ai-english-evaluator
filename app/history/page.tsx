"use client";

import { useEffect, useState } from "react";

type EvaluationRow = {
    id: string;
    evaluation_type: "writing" | "speaking";
    user_input: string;
    overall_score: number;
    grammar_feedback: string | null;
    vocabulary_feedback: string | null;
    fluency_feedback: string | null;
    improvement_suggestion: string | null;
    audio_url: string | null;
    created_at: string;
};

type FilterType = "all" | "writing" | "speaking";

export default function HistoryPage() {
    const [filter, setFilter] = useState<FilterType>("all");
    const [rows, setRows] = useState<EvaluationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory(filter);
    }, [filter]);

    async function loadHistory(f: FilterType) {
        setLoading(true);
        setError(null);
        try {
            const url = f === "all" ? "/api/history" : `/api/history?type=${f}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal memuat riwayat");
            setRows(data.evaluations || []);
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
    }

    const exportUrl = filter === "all" ? "/api/export" : `/api/export?type=${filter}`;

    return (
        <div className="space-y-6">
            <section className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="font-mono text-xs tracking-widest text-ink-soft uppercase mb-2">History</p>
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Riwayat Evaluasi</h1>
                </div>

                <a
                    href={exportUrl}
                    className="px-5 py-2 rounded-full border border-line text-sm font-medium hover:bg-white/5 transition-colors self-start"
                >
                    Export CSV
                </a>
            </section>

            <div className="flex gap-1">
                {(["all", "writing", "speaking"] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${filter === f
                                ? "bg-ink text-paper"
                                : "text-ink-soft hover:bg-white/5"
                            }`}
                    >
                        {f === "all" ? "Semua" : f}
                    </button>
                ))}
            </div>

            {loading && <p className="text-sm text-ink-soft">Memuat riwayat...</p>}
            {error && (
                <p className="text-sm text-speaking border-l-2 border-speaking pl-3">{error}</p>
            )}
            {!loading && rows.length === 0 && !error && (
                <p className="text-sm text-ink-soft">Belum ada evaluasi yang tersimpan.</p>
            )}

            <div className="space-y-3">
                {rows.map((row) => {
                    const isExpanded = expandedId === row.id;
                    const typeColor = row.evaluation_type === "writing" ? "text-writing" : "text-speaking";

                    return (
                        <div key={row.id} className="rounded-3xl border border-line bg-surface overflow-hidden">
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                                className="w-full text-left p-5 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`font-mono text-[10px] uppercase tracking-widest ${typeColor}`}>
                                        {row.evaluation_type}
                                    </span>
                                    <p className="text-sm text-ink-soft truncate max-w-md">{row.user_input}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="grade-stamp text-sm font-semibold">{row.overall_score}/100</span>
                                    <span className="text-xs text-ink-soft">{formatDate(row.created_at)}</span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-line p-5 space-y-4">
                                    {row.audio_url && <audio src={row.audio_url} controls className="w-full" />}
                                    <div>
                                        <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">
                                            {row.evaluation_type === "speaking" ? "Transcript" : "Teks"}
                                        </h3>
                                        <p className="text-sm leading-relaxed">{row.user_input}</p>
                                    </div>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div>
                                            <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Grammar</h3>
                                            <p className="text-sm leading-relaxed">{row.grammar_feedback}</p>
                                        </div>
                                        {row.fluency_feedback && (
                                            <div>
                                                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Fluency</h3>
                                                <p className="text-sm leading-relaxed">{row.fluency_feedback}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Vocabulary</h3>
                                            <p className="text-sm leading-relaxed">{row.vocabulary_feedback}</p>
                                        </div>
                                    </div>
                                    <div className="border-l-2 border-amber pl-4">
                                        <h3 className="font-mono text-xs uppercase tracking-widest text-amber mb-1">Saran Perbaikan</h3>
                                        <p className="text-sm leading-relaxed">{row.improvement_suggestion}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}