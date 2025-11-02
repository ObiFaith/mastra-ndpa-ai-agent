import { z } from "zod";
import { createToolCallAccuracyScorerCode } from "@mastra/evals/scorers/code";
import { createCompletenessScorer } from "@mastra/evals/scorers/code";
import { createScorer } from "@mastra/core/scores";

export const ndpaToolAccuracyScorer = createToolCallAccuracyScorerCode({
  expectedTool: "search-ndpa",
  strictMode: false,
});

export const completenessScorer = createCompletenessScorer();

export const ndpaRelevanceScorer = createScorer({
  name: "NDPA Relevance",
  description:
    "Evaluates whether the NDPA agent retrieved the most relevant section(s) to the user's query.",
  type: "agent",
  judge: {
    model: "groq/moonshotai/kimi-k2-instruct-0905",
    instructions:
      "You are an expert on Nigeria's Data Protection Act 2023. " +
      "Given a user's question and the assistant's cited section, determine if the section truly addresses the question. " +
      "Score based on factual alignment, relevance, and clarity. " +
      "Return only JSON in the specified schema." +
      "Never guess NDPA content if the search-ndpa tool returns a section. Always rely on its output.",
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || "";
    const assistantText = (run.output?.[0]?.content as string) || "";
    return { userText, assistantText };
  })
  .analyze({
    description:
      "Checks if the section provided matches the user's legal question context.",
    outputSchema: z.object({
      relevant: z.boolean(),
      confidence: z.number().min(0).max(1).default(0.5),
      explanation: z.string().default(""),
    }),
    createPrompt: ({ results }) => `
You are assessing if a legal assistant correctly referenced the Nigeria Data Protection Act (NDPA) 2023.
User Question:
"""
${results.preprocessStepResult.userText}
"""
Assistant Response:
"""
${results.preprocessStepResult.assistantText}
"""

Tasks:
1. Determine if the NDPA section cited directly answers or applies to the user's question.
2. If yes, set "relevant" = true. Otherwise, false.
3. Assign a confidence score (0-1) based on how closely it aligns.
Return JSON like:
{
  "relevant": boolean,
  "confidence": number,
  "explanation": string
}
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return r.relevant ? r.confidence : 0;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Relevance scoring: relevant=${r.relevant ?? false}, confidence=${r.confidence ?? 0}. ${r.explanation ?? ""} Score=${score}.`;
  });

export const scorers = {
  ndpaToolAccuracyScorer,
  completenessScorer,
  ndpaRelevanceScorer,
};
