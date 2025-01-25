import { json } from '@sveltejs/kit';

const SYSTEM_PROMPT: string = `
    ROLE: Friendly companion.
`;

export async function GET({ url }) {
    const voice = url.searchParams.get('voice') || 'alloy';
  
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        modalities: ["audio", "text"],
        instructions: SYSTEM_PROMPT,
        input_audio_transcription: { model:"whisper-1" }
      }),
    });
  
    const data = await response.json();
    console.log(data);
    return json(data);
  }
  