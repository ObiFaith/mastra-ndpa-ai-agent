import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { ndpaTool } from "../tools/ndpa-tool";
import { scorers } from "../scorers/ndpa-scorer";

export const ndpaAgent = new Agent({
  name: "NDPA Agent",
  instructions: `
You are an expert assistant specialized in the Nigeria Data Protection Act (NDPA) 2023.

Your goal is to help users understand their data protection rights and obligations under the NDPA. When responding:

- Always aim to cite the relevant Part and Section of the NDPA if possible.
- Use the "search-ndpa" tool to find the most applicable section.
- Summarize in plain English what the section means and how it applies.
- If no exact section is found, give a general but accurate explanation.
- Keep responses factual, concise, and legally neutral (no personal opinions).
- If the question involves privacy, consent, data breaches, or rights, clarify what the NDPA says about it.
- If the user writes in a Nigerian local language or Pidgin, understand it and reply in clear English.
  (Optionally, we'll later add a translation scorer for that.)
`,
  model: "groq/moonshotai/kimi-k2-instruct-0905",
  tools: { ndpaTool },
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.ndpaToolAccuracyScorer,
      sampling: { type: "ratio", rate: 1 },
    },
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: { type: "ratio", rate: 1 },
    },
    relevance: {
      scorer: scorers.ndpaRelevanceScorer,
      sampling: { type: "ratio", rate: 1 },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db", // Adjust relative path if needed
    }),
  }),
});
