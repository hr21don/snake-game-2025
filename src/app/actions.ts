'use server';

import { tuneAiOpponentBehavior } from '@/ai/flows/ai-opponent-tuning';
import type { TuneAiOpponentBehaviorInput } from '@/ai/flows/ai-opponent-tuning';

export async function tuneAiOpponent(input: TuneAiOpponentBehaviorInput) {
  try {
    const output = await tuneAiOpponentBehavior(input);
    return output;
  } catch (error) {
    console.error('Error tuning AI opponent:', error);
    // Optionally re-throw or return a specific error structure
    throw new Error('Failed to tune AI opponent behavior.');
  }
}
