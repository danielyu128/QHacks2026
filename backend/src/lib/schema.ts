import { z } from "zod";

export const coachOutputSchema = z.object({
  headline: z.string(),
  overallRiskScore: z.number().min(0).max(100),
  biasCards: z.array(
    z.object({
      bias: z.string(),
      severity: z.string(),
      evidence: z.array(z.string()),
      whyItHurts: z.string(),
      rules: z.array(
        z.object({
          title: z.string(),
          details: z.string(),
        })
      ),
      microHabit: z.string(),
    })
  ),
  literacyModules: z.array(
    z.object({
      title: z.string(),
      minutes: z.number(),
      lesson: z.string(),
      oneRule: z.string(),
      reflectionQuestion: z.string(),
      miniChallenge: z.string(),
    })
  ),
  brokerageFit: z.object({
    summary: z.string(),
    recommendations: z.array(z.string()),
  }),
  restModePlan: z.object({
    recommendedCooldownMinutes: z.number(),
    triggerRule: z.string(),
    script: z.string(),
  }),
  oneSentenceNudge: z.string(),
});

export type CoachOutput = z.infer<typeof coachOutputSchema>;
