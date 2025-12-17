import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple, everyday conversation scripts (each under 15 seconds when spoken)
const conversationScripts = {
  1: "Hi! My name is Sarah. I work as a teacher at a local school. I really enjoy my job because I love helping students learn new things every day.",
  2: "Good morning! I usually wake up at seven o'clock. First, I have breakfast with my family. Then I take a short walk before going to work. It's a nice routine.",
  3: "I think learning English is very important today. It helps you communicate with people from different countries. You can also read books and watch movies in English.",
  4: "Last weekend, I visited my grandmother. She lives in a small village near the mountains. We had lunch together and talked about old family stories. It was a wonderful visit.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const script = conversationScripts[questionId as keyof typeof conversationScripts];
    if (!script) {
      throw new Error("Invalid question ID");
    }

    console.log(`Generating audio for question ${questionId}`);

    // Use Sarah voice (EXAVITQu4vr4xnSDxMaL) - clear female voice
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_turbo_v2_5",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.3,
            speed: 0.9, // Slightly slower for learners
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    console.log(`Audio generated successfully for question ${questionId}`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        transcript: script 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating audio:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
