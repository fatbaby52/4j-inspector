// Edge Function: ai-executive-summary
// Generates executive summary from inspection data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createChatCompletion } from '../_shared/openai.ts';

interface SummaryRequest {
  inspection: {
    type: string;
    inspectionDate: string;
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    buildingData: Record<string, unknown>;
    observations: Record<string, Array<{
      grade: string;
      notes: Array<{ rawText?: string; cleanedText?: string }>;
    }>>;
  };
  feedback?: string;
}

const SYSTEM_PROMPT = `You are a professional property inspection report writer. Generate an executive summary for a property inspection report.

The executive summary should:
- Be 2-4 paragraphs long
- Start with basic property information and inspection date
- Provide an overall assessment of property condition
- Highlight any significant issues or safety concerns
- Mention positive aspects where appropriate
- Be written in professional, objective language
- Avoid technical jargon when possible
- Not include specific recommendations (those come later in the report)

If feedback is provided, incorporate it to adjust the tone, focus, or content.`;

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { inspection, feedback }: SummaryRequest = await req.json();

    // Count observations by grade
    let goodCount = 0;
    let fairCount = 0;
    let poorCount = 0;
    const significantIssues: string[] = [];

    Object.entries(inspection.observations).forEach(([itemId, observations]) => {
      observations.forEach((obs) => {
        if (obs.grade === 'good') goodCount++;
        else if (obs.grade === 'fair') fairCount++;
        else if (obs.grade === 'poor') {
          poorCount++;
          // Collect poor-rated items
          const note = obs.notes[0]?.cleanedText || obs.notes[0]?.rawText;
          if (note) {
            significantIssues.push(`${itemId}: ${note}`);
          }
        }
      });
    });

    const totalObservations = goodCount + fairCount + poorCount;
    const address = `${inspection.propertyAddress.street}, ${inspection.propertyAddress.city}, ${inspection.propertyAddress.state} ${inspection.propertyAddress.zip}`;
    const propertyType = inspection.type === 'home' ? 'residential property' : 'commercial facility';

    const userPrompt = `Generate an executive summary for this ${propertyType} inspection:

Property Address: ${address}
Inspection Date: ${new Date(inspection.inspectionDate).toLocaleDateString()}
Property Type: ${inspection.buildingData?.propertyType || propertyType}
Year Built: ${inspection.buildingData?.yearBuilt || 'Not specified'}

Inspection Results:
- Total items inspected: ${totalObservations}
- Good condition: ${goodCount}
- Fair condition (needs attention): ${fairCount}
- Poor condition (needs repair): ${poorCount}

${significantIssues.length > 0 ? `Significant issues found:\n${significantIssues.slice(0, 5).join('\n')}` : 'No major issues identified.'}

${feedback ? `\nUser feedback for revision: ${feedback}` : ''}`;

    const summary = await createChatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 1000,
    });

    return new Response(
      JSON.stringify({ summary: summary.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-executive-summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
