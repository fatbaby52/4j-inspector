// services/aiService.ts

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Inspection, Note, Recommendation } from '@/types/inspection';

// Helper to check if AI features are available
function ensureSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. AI features require cloud connection.');
  }
  return supabase;
}

// ============================================
// NOTE CLEANUP (Single)
// ============================================

export async function cleanupNote(
  note: Note,
  context: {
    category: string;
    item: string;
    grade: string;
  }
): Promise<string> {
  const { data, error } = await supabase!.functions.invoke('ai-cleanup-note', {
    body: {
      rawText: note.rawText,
      context,
    },
  });

  if (error) throw error;
  return data.cleanedText;
}

// ============================================
// NOTE CLEANUP (Batch)
// ============================================

export interface BatchNoteInput {
  noteId: string;
  observationId: string;
  itemId: string;
  rawText: string;
  context: { category: string; item: string; grade: string };
}

export interface BatchNoteResult {
  noteId: string;
  observationId: string;
  itemId: string;
  cleanedText: string;
  success: boolean;
  error?: string;
}

export async function cleanupNotesBatch(
  notes: BatchNoteInput[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchNoteResult[]> {
  const results: BatchNoteResult[] = [];
  const total = notes.length;

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);

    const batchPromises = batch.map(async (note) => {
      try {
        const { data, error } = await supabase!.functions.invoke('ai-cleanup-note', {
          body: {
            rawText: note.rawText,
            context: note.context,
          },
        });

        if (error) throw error;

        return {
          noteId: note.noteId,
          observationId: note.observationId,
          itemId: note.itemId,
          cleanedText: data.cleanedText,
          success: true,
        };
      } catch (err) {
        return {
          noteId: note.noteId,
          observationId: note.observationId,
          itemId: note.itemId,
          cleanedText: note.rawText,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < notes.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

// ============================================
// EXECUTIVE SUMMARY
// ============================================

export async function generateExecutiveSummary(
  inspection: Inspection,
  feedback?: string
): Promise<string> {
  const { data, error } = await supabase!.functions.invoke('ai-executive-summary', {
    body: {
      inspection: prepareInspectionForAI(inspection),
      feedback,
    },
  });

  if (error) throw error;
  return data.summary;
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function generateRecommendations(
  inspection: Inspection,
  feedback?: string
): Promise<Recommendation[]> {
  const { data, error } = await supabase!.functions.invoke('ai-recommendations', {
    body: {
      inspection: prepareInspectionForAI(inspection),
      feedback,
    },
  });

  if (error) throw error;

  // Add IDs and default status
  return data.recommendations.map((rec: Omit<Recommendation, 'id' | 'reviewStatus'>) => ({
    ...rec,
    id: crypto.randomUUID(),
    reviewStatus: 'pending' as const,
  }));
}

// ============================================
// HELPER
// ============================================

function prepareInspectionForAI(inspection: Inspection) {
  // Strip blobs and unnecessary data, keep relevant info
  return {
    type: inspection.type,
    inspectionDate: inspection.inspectionDate,
    propertyAddress: inspection.propertyAddress,
    buildingData: inspection.buildingData,
    observations: inspection.observations,
  };
}

// ============================================
// MOCK IMPLEMENTATIONS (for offline/testing)
// ============================================

export async function mockCleanupNote(rawText: string): Promise<string> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

  // Simple cleanup: capitalize first letter, add period if missing
  let cleaned = rawText.trim();
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}

export async function mockGenerateExecutiveSummary(inspection: Inspection): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500));

  const address = `${inspection.propertyAddress.street}, ${inspection.propertyAddress.city}`;
  const type = inspection.type === 'home' ? 'residential property' : 'commercial facility';

  // Count observations by grade
  let goodCount = 0;
  let fairCount = 0;
  let poorCount = 0;

  Object.values(inspection.observations).forEach((obs) => {
    obs.forEach((o) => {
      if (o.grade === 'good') goodCount++;
      else if (o.grade === 'fair') fairCount++;
      else if (o.grade === 'poor') poorCount++;
    });
  });

  return `This ${type} inspection was conducted at ${address} on ${new Date(inspection.inspectionDate).toLocaleDateString()}.

Overall, the property is in ${poorCount > 3 ? 'fair' : poorCount > 0 ? 'good' : 'excellent'} condition. The inspection identified ${goodCount} items in good condition, ${fairCount} items requiring attention, and ${poorCount} items needing repair or replacement.

${poorCount > 0 ? 'Priority attention should be given to the items rated as "Poor" which may affect the safety, functionality, or value of the property.' : 'No immediate safety concerns were identified during this inspection.'}

This report provides a comprehensive overview of the property's current condition and recommendations for maintenance and repairs.`;
}

export async function mockGenerateRecommendations(inspection: Inspection): Promise<Recommendation[]> {
  await new Promise((r) => setTimeout(r, 1500));

  const recommendations: Recommendation[] = [];

  // Generate recommendations based on poor/fair grades
  Object.entries(inspection.observations).forEach(([itemId, obs]) => {
    obs.forEach((o) => {
      if (o.grade === 'poor') {
        recommendations.push({
          id: crypto.randomUUID(),
          priority: 'high',
          category: itemId.split('-')[0],
          title: `Address ${itemId.replace(/-/g, ' ')} issues`,
          description: `Based on the inspection findings, this item requires immediate attention. We recommend consulting with a licensed contractor to assess and repair the identified issues.`,
          estimatedUrgency: 'Within 30 days',
          reviewStatus: 'pending',
        });
      } else if (o.grade === 'fair') {
        recommendations.push({
          id: crypto.randomUUID(),
          priority: 'medium',
          category: itemId.split('-')[0],
          title: `Monitor ${itemId.replace(/-/g, ' ')}`,
          description: `This item shows signs of wear or minor issues. Regular monitoring and preventive maintenance is recommended to prevent further deterioration.`,
          estimatedUrgency: 'Within 6 months',
          reviewStatus: 'pending',
        });
      }
    });
  });

  // If no issues found, add a positive recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      id: crypto.randomUUID(),
      priority: 'low',
      category: 'General',
      title: 'Continue Regular Maintenance',
      description: 'The property is in good condition. Continue with regular maintenance schedules to preserve the property value and prevent future issues.',
      estimatedUrgency: 'When convenient',
      reviewStatus: 'pending',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
