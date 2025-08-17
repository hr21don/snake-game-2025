'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tuneAiOpponent } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { GameSettings, AiConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Bot, Zap } from 'lucide-react';

interface GameControlsProps {
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  aiConfig: AiConfig;
  setAiConfig: React.Dispatch<React.SetStateAction<AiConfig>>;
  isGameRunning: boolean;
}

const AITuningSchema = z.object({
  strategyDescription: z.string().min(10, "Describe the AI's strategy in a bit more detail."),
});

export function GameControls({ gameSettings, setGameSettings, aiConfig, setAiConfig, isGameRunning }: GameControlsProps) {
  const { toast } = useToast();
  const [isTuning, setIsTuning] = React.useState(false);

  const form = useForm<z.infer<typeof AITuningSchema>>({
    resolver: zodResolver(AITuningSchema),
    defaultValues: {
      strategyDescription: aiConfig.strategyDescription,
    },
  });

  const onSubmit = async (values: z.infer<typeof AITuningSchema>) => {
    setIsTuning(true);
    try {
      const result = await tuneAiOpponent({ strategyDescription: values.strategyDescription });
      if (result) {
        setAiConfig({ ...result, strategyDescription: values.strategyDescription });
        form.setValue('strategyDescription', values.strategyDescription);
        toast({
          title: "AI Tuned!",
          description: `AI is now: ${result.description}`,
        });
      } else {
        throw new Error("AI tuning returned no result.");
      }
    } catch (error) {
      console.error("AI tuning failed:", error);
      toast({
        variant: "destructive",
        title: "AI Tuning Failed",
        description: "Could not get a response from the AI. Please try again.",
      });
    } finally {
      setIsTuning(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="speed-slider" className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-primary" /> Game Speed</Label>
        <Slider
          id="speed-slider"
          min={1}
          max={10}
          step={1}
          value={[gameSettings.speed]}
          onValueChange={([value]) => setGameSettings(prev => ({ ...prev, speed: value }))}
          disabled={isGameRunning}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           <FormLabel className="flex items-center gap-2"><Bot className="w-4 h-4 text-accent" /> AI Opponent Tuning</FormLabel>
          <FormField
            control={form.control}
            name="strategyDescription"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="e.g., 'An aggressive opponent that tries to cut me off.'" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isTuning}>
            {isTuning ? 'Tuning...' : 'Tune AI with GenAI'}
          </Button>
           <FormDescription>{aiConfig.description}</FormDescription>
        </form>
      </Form>
      
      <div className="space-y-4">
          <div>
            <Label htmlFor="ai-speed-slider">AI Speed: {aiConfig.speed.toFixed(2)}</Label>
            <Slider
              id="ai-speed-slider"
              min={0.1}
              max={1}
              step={0.05}
              value={[aiConfig.speed]}
              onValueChange={([value]) => setAiConfig(prev => ({ ...prev, speed: value }))}
              disabled={isGameRunning}
            />
          </div>
          <div>
            <Label htmlFor="ai-aggro-slider">AI Aggressiveness: {aiConfig.aggressiveness.toFixed(2)}</Label>
            <Slider
              id="ai-aggro-slider"
              min={0.1}
              max={1}
              step={0.05}
              value={[aiConfig.aggressiveness]}
              onValueChange={([value]) => setAiConfig(prev => ({ ...prev, aggressiveness: value }))}
              disabled={isGameRunning}
            />
          </div>
      </div>
    </div>
  );
}
