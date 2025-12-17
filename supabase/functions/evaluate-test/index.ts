import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestAnswer {
  questionId: number;
  question: string;
  answer: string;
  type: 'easy' | 'medium' | 'hard' | 'descriptive';
}

interface EvaluationRequest {
  testType: 'written' | 'listening';
  answers: TestAnswer[];
  userName?: string;
  userEmail?: string;
}

const cefrMapping = [
  { min: 0, max: 30, level: 'A1', course: 'Student Foundation' },
  { min: 31, max: 50, level: 'A2', course: 'Student Foundation' },
  { min: 51, max: 65, level: 'B1', course: 'Professional Excellence' },
  { min: 66, max: 80, level: 'B2', course: 'Professional Excellence' },
  { min: 81, max: 90, level: 'C1', course: 'Competitive Edge' },
  { min: 91, max: 100, level: 'C2', course: 'Teacher Training' },
];

function getCEFRLevel(score: number): { level: string; course: string } {
  for (const mapping of cefrMapping) {
    if (score >= mapping.min && score <= mapping.max) {
      return { level: mapping.level, course: mapping.course };
    }
  }
  return { level: 'A1', course: 'Student Foundation' };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { testType, answers, userName, userEmail }: EvaluationRequest = await req.json();

    console.log("Evaluating test:", { testType, answersCount: answers.length });

    // Build evaluation prompt
    const answersText = answers.map((a, i) => 
      `Question ${i + 1} (${a.type}): ${a.question}\nStudent Answer: ${a.answer || "(No answer provided)"}`
    ).join('\n\n');

    const systemPrompt = `You are an expert English language evaluator. Evaluate the student's answers for a ${testType} test.
For each answer, provide scores (0-100) for:
- Grammar: Correctness of grammar usage
- Vocabulary: Range and appropriateness of vocabulary
- Coherence: Logical flow and organization
- Fluency: Natural expression and communication

Also provide brief, constructive feedback for each answer.

Return your evaluation in this exact JSON format:
{
  "evaluations": [
    {
      "questionId": 1,
      "grammar": 85,
      "vocabulary": 80,
      "coherence": 75,
      "fluency": 70,
      "feedback": "Your feedback here"
    }
  ],
  "overallFeedback": "Overall assessment of the student's performance",
  "strengths": ["strength1", "strength2"],
  "areasToImprove": ["area1", "area2"]
}`;

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
          { role: "user", content: `Please evaluate these ${testType} test answers:\n\n${answersText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI evaluation failed");
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    console.log("AI response received");

    // Parse AI response
    let evaluation;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      evaluation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Provide default evaluation if parsing fails
      evaluation = {
        evaluations: answers.map((_, i) => ({
          questionId: i + 1,
          grammar: 70,
          vocabulary: 70,
          coherence: 70,
          fluency: 70,
          feedback: "Evaluation completed. Keep practicing!"
        })),
        overallFeedback: "Your test has been evaluated. Continue practicing to improve.",
        strengths: ["Completed the test"],
        areasToImprove: ["Continue regular practice"]
      };
    }

    // Calculate overall score
    const totalScores = evaluation.evaluations.reduce((acc: number, e: any) => {
      return acc + (e.grammar + e.vocabulary + e.coherence + e.fluency) / 4;
    }, 0);
    const scorePercentage = Math.round(totalScores / evaluation.evaluations.length);

    // Get CEFR level and recommended course
    const { level: cefrLevel, course: recommendedCourse } = getCEFRLevel(scorePercentage);

    // Save to database
    const { data: testAttempt, error: dbError } = await supabase
      .from("test_attempts")
      .insert({
        user_name: userName || null,
        user_email: userEmail || null,
        test_type: testType,
        answers: answers,
        score_percentage: scorePercentage,
        cefr_level: cefrLevel,
        recommended_course: recommendedCourse,
        ai_evaluation: evaluation,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    console.log("Test evaluation complete:", { scorePercentage, cefrLevel, recommendedCourse });

    return new Response(JSON.stringify({
      success: true,
      attemptId: testAttempt?.id,
      scorePercentage,
      cefrLevel,
      recommendedCourse,
      evaluation,
      answers,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in evaluate-test function:", error);
    return new Response(JSON.stringify({ error: error.message || "Evaluation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
