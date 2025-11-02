import { z } from "zod";
import { findSectionQuery } from "../tools/ndpa-tool";
import { createStep, createWorkflow } from "@mastra/core/workflows";

// Step 1: Search NDPA
const searchNdpa = createStep({
  id: "search-ndpa-step",
  description: "Find relevant NDPA section(s) for a user's question",
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    part: z.string(),
    section_number: z.string(),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error("Input data not found");

    // 👉 Run the actual NDPA search logic here
    const result = await findSectionQuery(inputData.question); // e.g. call your tool function directly

    return {
      part: result.part,
      section_number: result.section_number,
      summary: result.summary,
    };
  },
});

// Step 2: Summarize & explain NDPA section in plain English
const explainNdpa = createStep({
  id: "explain-ndpa-step",
  description: "Summarize and explain the relevant NDPA section",
  inputSchema: z.object({
    part: z.string(),
    section_number: z.string(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    explanation: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("ndpaAgent");
    if (!agent) throw new Error("NDPA Agent not found");

    const prompt = `
User asked about a specific part of the Nigeria Data Protection Act.

Part: ${inputData.part}
Section: ${inputData.section_number}

Summary:
${inputData.summary}

Explain in clear, simple English what this section means and how it applies to individuals or companies.
`;

    const response = await agent.stream([{ role: "user", content: prompt }]);

    let explanation = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      explanation += chunk;
    }

    return { explanation };
  },
});

// Combine into a workflow
const ndpaWorkflow = createWorkflow({
  id: "ndpa-workflow",
  inputSchema: z.object({
    question: z.string().describe("User's legal or privacy question"),
  }),
  outputSchema: z.object({
    explanation: z.string(),
  }),
})
  .then(searchNdpa)
  .then(explainNdpa);

ndpaWorkflow.commit();

export { ndpaWorkflow };
