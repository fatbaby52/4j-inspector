// Edge Function: ai-recommendations
// Generates prioritized recommendations from inspection data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createChatCompletion } from '../_shared/openai.ts';

interface RecommendationsRequest {
  inspection: {
    type: string;
    inspectionDate: string;
    propertyAddress: Record<string, string>;
    buildingData: Record<string, unknown>;
    observations: Record<string, Array<{
      grade: string;
      notes: Array<{ rawText?: string; cleanedText?: string }>;
    }>>;
  };
  feedback?: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  estimatedUrgency: string;
}

const SYSTEM_PROMPT = `You are a professional property inspection consultant. Based on inspection findings, generate actionable recommendations for the property owner.

For each issue found, create a recommendation with:
- priority: "high" (safety issues, major defects), "medium" (functional issues, moderate wear), or "low" (maintenance items, minor concerns)
- category: The inspection category (e.g., "Roofing", "Electrical", "Plumbing")
- title: A brief, clear title for the recommendation
- description: 2-3 sentences explaining the issue and what should be done
- estimatedUrgency: "Immediate", "Within 30 days", "Within 6 months", "Within 12 months", or "When convenient"

Guidelines:
- Focus on "Poor" and "Fair" rated items
- Safety issues should always be high priority
- Be specific but avoid overly technical language
- Suggest consulting professionals where appropriate
- Don't recommend unnecessary work
- If no issues found, provide general maintenance recommendations

Return a JSON array of recommendations, sorted by priority (high first).`;

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { inspection, feedback }: RecommendationsRequest = await req.json();

    // Gather issues
    const issues: Array<{ itemId: string; grade: string; note: string }> = [];

    Object.entries(inspection.observations).forEach(([itemId, observations]) => {
      observations.forEach((obs) => {
        if (obs.grade === 'poor' || obs.grade === 'fair') {
          const note = obs.notes[0]?.cleanedText || obs.notes[0]?.rawText || '';
          issues.push({
            itemId,
            grade: obs.grade,
            note,
          });
        }
      });
    });

    const propertyType = inspection.type === 'home' ? 'residential property' : 'commercial facility';

    const userPrompt = `Generate recommendations for this ${propertyType} inspection:

Property Type: ${inspection.buildingData?.propertyType || propertyType}
Year Built: ${inspection.buildingData?.yearBuilt || 'Not specified'}

Issues Found:
${issues.length > 0
  ? issues.map(i => `- ${i.itemId} (${i.grade.toUpperCase()}): ${i.note}`).join('\n')
  : 'No significant issues found - provide general maintenance recommendations.'}

${feedback ? `\nUser feedback: ${feedback}` : ''}

Return ONLY a valid JSON array of recommendation objects with the structure specified.`;

    const response = await createChatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 2000,
    });

    // Parse the JSON response
    let recommendations: Recommendation[];
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Failed to parse recommendations:', response);
      // Return a default recommendation if parsing fails
      recommendations = [{
        priority: 'low',
        category: 'General',
        title: 'Schedule Regular Maintenance',
        description: 'Continue with regular property maintenance to preserve value and prevent future issues. Consider scheduling annual inspections.',
        estimatedUrgency: 'When convenient',
      }];
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
