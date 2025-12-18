import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

interface TestAnswer {
  questionId: number;
  question: string;
  answer: string;
  type: 'written' | 'listening';
}

// CEFR level mapping based on score
const getCEFRLevel = (score: number) => {
  if (score >= 90) return { level: 'C2', course: 'Advanced Mastery' };
  if (score >= 80) return { level: 'C1', course: 'Professional English' };
  if (score >= 70) return { level: 'B2', course: 'Upper Intermediate' };
  if (score >= 60) return { level: 'B1', course: 'Intermediate English' };
  if (score >= 50) return { level: 'A2', course: 'Elementary English' };
  return { level: 'A1', course: 'Beginner English' };
};

// POST /api/evaluate-test - Evaluate test answers using AI
router.post('/', async (req: Request, res: Response) => {
  try {
    const { answers, testType, userName, userEmail } = req.body as {
      answers: TestAnswer[];
      testType: 'written' | 'listening';
      userName?: string;
      userEmail?: string;
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'No answers provided' });
    }

    // Determine AI provider
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    let apiKey: string | undefined;
    let apiUrl: string;

    switch (aiProvider) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        break;
      case 'groq':
        apiKey = process.env.GROQ_API_KEY;
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        break;
      case 'gemini':
      default:
        apiKey = process.env.GEMINI_API_KEY;
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        break;
    }

    if (!apiKey) {
      return res.status(500).json({ error: `${aiProvider.toUpperCase()}_API_KEY is not configured` });
    }

    // Build evaluation prompt
    const evaluationPrompt = `You are an expert English language assessor. Evaluate these ${testType} test answers and provide scores.

Test Answers:
${answers.map((a, i) => `
Question ${i + 1}: ${a.question}
Answer: ${a.answer}
`).join('\n')}

Provide your evaluation in this exact JSON format:
{
  "scores": [
    { "questionId": 1, "score": 85, "feedback": "Good grammar and vocabulary usage" }
  ],
  "overallScore": 75,
  "strengths": ["Good vocabulary", "Clear structure"],
  "improvements": ["Work on complex sentences", "Practice tenses"],
  "summary": "Overall assessment summary here"
}

Score each answer 0-100 based on:
- Grammar accuracy (25%)
- Vocabulary usage (25%)
- Coherence and relevance (25%)
- Communication effectiveness (25%)

Be constructive and encouraging in feedback.`;

    let aiResponse: string;

    if (aiProvider === 'gemini') {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: evaluationPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI evaluation failed');
      }

      const data = await response.json();
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI/Groq compatible
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an expert English language assessor. Always respond with valid JSON.' },
            { role: 'user', content: evaluationPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error('AI evaluation failed');
      }

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content || '';
    }

    // Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI evaluation');
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    const { level: cefrLevel, course: recommendedCourse } = getCEFRLevel(evaluation.overallScore);

    // Save to database
    const saveResult = await pool.query(`
      INSERT INTO test_attempts (
        test_type, user_name, user_email, answers, 
        score_percentage, cefr_level, recommended_course, 
        ai_evaluation, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `, [
      testType,
      userName || null,
      userEmail || null,
      JSON.stringify(answers),
      evaluation.overallScore,
      cefrLevel,
      recommendedCourse,
      JSON.stringify(evaluation),
    ]);

    res.json({
      success: true,
      attemptId: saveResult.rows[0].id,
      score: evaluation.overallScore,
      cefrLevel,
      recommendedCourse,
      evaluation: {
        scores: evaluation.scores,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        summary: evaluation.summary,
      },
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate test' });
  }
});

export default router;
