import { Router, Request, Response } from 'express';

const router = Router();

// Course information for the AI assistant
const courseInfo = {
  student: { name: "Student English", duration: "6 months", price: "₹15,000", focus: "Academic English, exam prep" },
  professional: { name: "Professional English", duration: "4 months", price: "₹20,000", focus: "Business communication, presentations" },
  competitive: { name: "Competitive Exam Prep", duration: "3 months", price: "₹18,000", focus: "IELTS, TOEFL, PTE preparation" },
  teacher: { name: "Teacher Training", duration: "2 months", price: "₹25,000", focus: "Teaching methodologies, classroom management" },
};

const getSystemPrompt = (language: string, userName?: string) => `
You are Laila, a friendly and helpful English course advisor at Vibe & Code English Academy.

${userName ? `The user's name is ${userName}. Use their name occasionally to personalize the conversation.` : ''}

Your personality:
- Warm, encouraging, and patient
- Enthusiastic about helping people learn English
- Professional but approachable

Available courses:
${Object.entries(courseInfo).map(([key, course]) => `- ${course.name}: ${course.duration}, ${course.price} - Focus: ${course.focus}`).join('\n')}

Platform details:
- Website has a demo test to assess English level
- Free trial classes available
- Located in India, serving students worldwide

Your role:
- Help users choose the right course based on their needs
- Answer questions about courses, pricing, and schedules
- Encourage users to take the demo test or book a free trial
- ${language === 'hi' ? 'Respond in Hindi when appropriate, mixing English terms for course names' : 'Respond in English'}

Keep responses concise (2-3 sentences) unless more detail is needed.
`;

// POST /api/laila-chat - Stream chat responses
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, language = 'en', userName } = req.body;

    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    let apiKey: string | undefined;
    let apiUrl: string;
    let model: string;

    switch (aiProvider) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-3.5-turbo';
        break;
      case 'groq':
        apiKey = process.env.GROQ_API_KEY;
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.1-70b-versatile';
        break;
      case 'gemini':
      default:
        apiKey = process.env.GEMINI_API_KEY;
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`;
        model = 'gemini-1.5-flash';
        break;
    }

    if (!apiKey) {
      return res.status(500).json({ error: `${aiProvider.toUpperCase()}_API_KEY is not configured` });
    }

    const systemPrompt = getSystemPrompt(language, userName);

    // Handle Gemini API differently (different format)
    if (aiProvider === 'gemini') {
      const geminiMessages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I am Laila, ready to help with English courses.' }] },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        return res.status(500).json({ error: 'AI service error' });
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Stream the response word by word for better UX
      const words = text.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word + ' ' } }] })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // OpenAI/Groq compatible API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return res.status(500).json({ error: 'AI service error' });
    }

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'Failed to read response stream' });
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
