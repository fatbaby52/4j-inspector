// Edge Function: ai-cleanup-note
// Cleans up raw field notes into professional language

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createChatCompletion } from '../_shared/openai.ts';

interface CleanupRequest {
  rawText: string;
  context: {
    category: string;
    item: string;
    grade: string;
  };
}

const SYSTEM_PROMPT = `You are a professional property inspection report editor. Your task is to convert raw field notes (often written quickly or dictated via voice) into clear, professional language suitable for a formal inspection report.

Guidelines:
- Maintain technical accuracy - don't add information that wasn't in the original
- Use professional, objective language
- Keep the same meaning and observations
- Fix grammar, spelling, and punctuation
- Convert informal speech patterns to professional writing
- Keep it concise but complete
- Use present tense for current conditions
- Avoid subjective opinions - stick to observable facts
- If the note mentions a grade or condition, ensure consistency

Output ONLY the cleaned text, no explanations or quotation marks.`;

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { rawText, context }: CleanupRequest = await req.json();

    if (!rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'rawText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Category: ${context.category}
Item: ${context.item}
Grade: ${context.grade}

Raw field note to clean up:
"${rawText}"`;

    const cleanedText = await createChatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
    });

    return new Response(
      JSON.stringify({ cleanedText: cleanedText.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-cleanup-note:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
