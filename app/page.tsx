import Link from "next/link";

export default function HomePage() {
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  return (
    <div className="space-y-10">
      <section>
        <p className="font-mono text-xs tracking-widest text-ink-soft uppercase mb-3">
          Project — LLM Application
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] max-w-xl">
          Evaluasi bahasa Inggris oleh AI
        </h1>
        <p className="mt-4 text-ink-soft max-w-md leading-relaxed">
          Tulis atau rekam suara. AI akan memberi skor, koreksi grammar,
          catatan kosakata dan saran perbaikan.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/writing"
          className="group rounded-3xl border border-line bg-surface p-6 hover:border-writing transition-colors"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-writing">
            Writing
          </span>
          <h2 className="font-display text-xl font-semibold mt-2">Writing Evaluation</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            Tulis esai/paragraf, dapatkan skor, feedback grammar dan
            vocabulary, serta saran perbaikan.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-writing group-hover:underline">
            Mulai menulis →
          </span>
        </Link>

        <Link
          href="/speaking"
          className="group rounded-3xl border border-line bg-surface p-6 hover:border-speaking transition-colors"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-speaking">
            Speaking
          </span>
          <h2 className="font-display text-xl font-semibold mt-2">Speaking Evaluation</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            Rekam atau upload audio, otomatis diubah jadi transcript lalu
            dinilai fluency, grammar dan vocabulary.
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-speaking group-hover:underline">
            Mulai bicara →
          </span>
        </Link>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-display font-semibold">AI Model yang digunakan</h3>
          <p className="text-sm text-ink-soft mt-1">
            Evaluasi teks lewat OpenRouter, transcript audio lewat Whisper (Groq).
          </p>
        </div>
        <code className="grade-stamp text-sm text-ink-soft">{model}</code>
      </section>
    </div>
  );
}