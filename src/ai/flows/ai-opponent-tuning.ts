'use server';

/**
 * @fileOverview An AI opponent behavior tuning flow.
 *
 * - tuneAiOpponentBehavior - A function that tunes the AI opponent's behavior based on natural language input.
 * - TuneAiOpponentBehaviorInput - The input type for the tuneAiOpponentBehavior function.
 * - TuneAiOpponentBehaviorOutput - The return type for the tuneAiOpponentBehavior function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TuneAiOpponentBehaviorInputSchema = z.object({
  strategyDescription: z
    .string()
    .describe(
      'A description of the desired AI opponent strategy, including difficulty level.'
    ),
});
export type TuneAiOpponentBehaviorInput = z.infer<typeof TuneAiOpponentBehaviorInputSchema>;

const TuneAiOpponentBehaviorOutputSchema = z.object({
  speed: z
    .number()
    .describe('The speed of the AI opponent (e.g., 0.5 for half speed).'),
  aggressiveness: z
    .number()
    .describe(
      'The aggressiveness of the AI opponent (e.g., 0.8 for very aggressive).'
    ),
  description: z
    .string()
    .describe(
      'A short description of the AI behavior that reflects the strategy description.'
    ),
});
export type TuneAiOpponentBehaviorOutput = z.infer<typeof TuneAiOpponentBehaviorOutputSchema>;

export async function tuneAiOpponentBehavior(
  input: TuneAiOpponentBehaviorInput
): Promise<TuneAiOpponentBehaviorOutput> {
  return tuneAiOpponentBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tuneAiOpponentBehaviorPrompt',
  input: {schema: TuneAiOpponentBehaviorInputSchema},
  output: {schema: TuneAiOpponentBehaviorOutputSchema},
  prompt: `You are an expert game AI tuning specialist.

You will be provided with a description of the desired AI opponent strategy and difficulty level.

Based on this description, you will determine the appropriate speed and aggressiveness for the AI opponent.

Strategy Description: {{{strategyDescription}}}

Please output the speed (a number between 0 and 1, where 1 is the maximum speed), aggressiveness (a number between 0 and 1, where 1 is the most aggressive), and a very short description of the AI behavior.
`,
});

const tuneAiOpponentBehaviorFlow = ai.defineFlow(
  {
    name: 'tuneAiOpponentBehaviorFlow',
    inputSchema: TuneAiOpponentBehaviorInputSchema,
    outputSchema: TuneAiOpponentBehaviorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
