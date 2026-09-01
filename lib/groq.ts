export async function transcribeAudio(audioBlob: Blob, filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum diset di .env.local");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");
  formData.append("language", "en");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq transcription error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.text || "").trim();
}