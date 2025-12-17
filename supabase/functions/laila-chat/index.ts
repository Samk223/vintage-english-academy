import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Course information for recommendations
const courseInfo = {
  student: {
    name: "Student English Program",
    description: "Perfect for school and college students who want to improve their spoken English, grammar, and confidence in academic settings.",
    idealFor: ["school students", "college students", "academic English", "exam preparation"],
    cefr: ["A1", "A2", "B1"]
  },
  professional: {
    name: "Professional English Program",
    description: "Designed for working professionals who need fluent English for meetings, presentations, and workplace communication.",
    idealFor: ["working professionals", "business English", "corporate communication", "presentations"],
    cefr: ["B1", "B2", "C1"]
  },
  competitive: {
    name: "Competitive Exam Program",
    description: "Intensive preparation for IELTS, TOEFL, and other competitive English exams with proven strategies.",
    idealFor: ["IELTS", "TOEFL", "competitive exams", "study abroad"],
    cefr: ["B1", "B2", "C1"]
  },
  teacher: {
    name: "Teacher Training Program",
    description: "Advanced program for teachers who want to enhance their English teaching methodologies and communication.",
    idealFor: ["teachers", "educators", "training", "teaching methodology"],
    cefr: ["B2", "C1"]
  }
};

function getSystemPrompt(language: string, userName?: string) {
  const langInstruction = language === 'hi' 
    ? "You MUST respond ONLY in Hindi (Devanagari script). Never use English in your responses."
    : "You MUST respond ONLY in English. Never use Hindi in your responses.";
  
  const greeting = userName ? `The user's name is ${userName}. Address them by name warmly.` : "";

  return `You are Laila, a friendly and knowledgeable course advisor for an English learning platform in Mumbai. You help students find the perfect English course based on their needs and goals.

${langInstruction}
${greeting}

PERSONALITY:
- You are warm, encouraging, and supportive
- You speak in a conversational, friendly manner
- You are knowledgeable about English learning and the courses offered
- You ask thoughtful questions to understand the student's needs

AVAILABLE COURSES:
1. **Student English Program**: For school/college students wanting to improve spoken English, grammar, and academic confidence. Suitable for A1-B1 levels.

2. **Professional English Program**: For working professionals needing fluent English for meetings, presentations, and workplace communication. Suitable for B1-C1 levels.

3. **Competitive Exam Program**: Intensive IELTS, TOEFL preparation with proven strategies. Suitable for B1-C1 levels.

4. **Teacher Training Program**: Advanced program for educators to enhance teaching methodologies. Suitable for B2-C1 levels.

ABOUT THE PLATFORM:
- Located in Mumbai, India
- Offers both online (Zoom/Google Meet) and in-person classes
- Free trial class available
- Flexible scheduling
- Personalized attention with small batch sizes
- Expert instructor with years of teaching experience

YOUR ROLE:
1. Greet users warmly and ask their name if not known
2. Understand their English learning goals
3. Ask about their current English level
4. Recommend the most suitable course
5. Encourage them to book a free trial class
6. Answer any questions about the platform

Keep responses concise but helpful. Be encouraging about their English learning journey!`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en', userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = getSystemPrompt(language, userName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable, please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("laila-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
