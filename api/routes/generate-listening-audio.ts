import { Router, Request, Response } from 'express';

const router = Router();

// Simple conversation scripts for listening tests
const conversationScripts: Record<number, string> = {
  1: "Hi! My name is Sarah. I work as a teacher at a local school. I really enjoy my job because I love helping students learn new things every day.",
  2: "Good morning! I usually wake up at seven o'clock. First, I have breakfast with my family. Then I take a short walk before going to work. It's a nice routine.",
  3: "I think learning English is very important today. It helps you communicate with people from different countries. You can also read books and watch movies in English.",
  4: "Last weekend, I visited my grandmother. She lives in a small village near the mountains. We had lunch together and talked about old family stories. It was a wonderful visit.",
};

// POST /api/generate-listening-audio - Generate TTS audio using ElevenLabs
router.post('/', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.body;

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured' });
    }

    const script = conversationScripts[questionId as number];
    if (!script) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    console.log(`Generating audio for question ${questionId}`);

    // Use Sarah voice (EXAVITQu4vr4xnSDxMaL) - clear female voice
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_turbo_v2_5',
          output_format: 'mp3_44100_128',
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
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(500).json({ error: `ElevenLabs API error: ${response.status}` });
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`Audio generated successfully for question ${questionId}`);

    res.json({
      audioContent: base64Audio,
      transcript: script,
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
