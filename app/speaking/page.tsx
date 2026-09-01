"use client";

import { useRef, useState } from "react";

type SpeakingResult = {
  id: string;
  user_input: string;
  overall_score: number;
  grammar_feedback: string;
  vocabulary_feedback: string;
  fluency_feedback: string;
  improvement_suggestion: string;
};

export default function SpeakingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function startRecording() {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Tidak bisa mengakses mikrofon. Pastikan izin browser sudah diberikan.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  }

  async function handleEvaluate() {
    if (!audioBlob) {
      setError("Rekam atau unggah audio terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      const filename = audioBlob instanceof File ? audioBlob.name : "recording.webm";
      formData.append("audio", audioBlob, filename);

      const res = await fetch("/api/speaking", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengevaluasi audio.");
      setResult(data.evaluation);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="font-mono text-xs tracking-widest text-speaking uppercase mb-2">
          Speaking Evaluation
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Rekam atau unggah suaramu
        </h1>
        <p className="text-ink-soft mt-2 max-w-xl">
          Bicara dalam Bahasa Inggris selama 20-45 detik. Audio akan diubah
          menjadi transcript, lalu dinilai grammar, fluency dan vocabulary.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 space-y-5">
        <div className="flex items-center gap-4 flex-wrap">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-2.5 rounded-full bg-speaking text-ink text-sm font-medium hover:opacity-90 transition-opacity"
            >
              ● Mulai Rekam
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-full bg-speaking text-ink text-sm font-medium hover:opacity-90 transition-opacity"
            >
              ■ Stop ({formatTime(seconds)})
            </button>
          )}

          <span className="text-sm text-ink-soft">atau</span>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-full border border-line text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Upload Audio
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {audioPreviewUrl && <audio src={audioPreviewUrl} controls className="w-full" />}

        {audioBlob && (
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-speaking text-ink text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Memproses transcript & evaluasi..." : "Evaluate"}
          </button>
        )}
      </section>

      {error && (
        <p className="text-sm text-speaking border-l-2 border-speaking pl-3">{error}</p>
      )}

      {result && (
        <section className="rounded-3xl border border-line bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Hasil Evaluasi</h2>
            <span className="grade-stamp text-2xl font-semibold text-speaking">
              {result.overall_score}
              <span className="text-sm text-ink-soft">/100</span>
            </span>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">
              Transcript
            </h3>
            <p className="text-sm leading-relaxed italic text-ink-soft">
              &ldquo;{result.user_input}&rdquo;
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Grammar</h3>
              <p className="text-sm leading-relaxed">{result.grammar_feedback}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Fluency</h3>
              <p className="text-sm leading-relaxed">{result.fluency_feedback}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-1">Vocabulary</h3>
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