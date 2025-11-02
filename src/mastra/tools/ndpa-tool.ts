import fs from "fs";
import { z } from "zod";
import path from "path";
import { createTool } from "@mastra/core/tools";

const ndpaPath = path.resolve(process.cwd(), "../..", "ndpa_structured.json");
const ndpaJson = JSON.parse(fs.readFileSync(ndpaPath, "utf8"));

// --- Simple helper to find best matching section ---
export const findSectionQuery = async (question: string) => {
  const query = question.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  // Flatten parts + sections for searching
  const allSections = ndpaJson.flatMap((part: any) =>
    part.sections.map((s: any) => ({
      part: part.part,
      section_number: s.section_number,
      content: s.content,
    }))
  );

  // Simple keyword search (can later upgrade to embeddings)
  for (const sec of allSections) {
    const content = sec.content.toLowerCase();
    const score = query.split(" ").filter(w => content.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sec;
    }
  }

  if (bestMatch && bestScore > 0) {
    return {
      part: bestMatch.part,
      section_number: bestMatch.section_number,
      summary: bestMatch.content.slice(0, 500) + "...", // trim for readability
    };
  }

  return {
    part: "N/A",
    section_number: "N/A",
    summary:
      "No specific section found, but here's what the NDPA generally says about data protection.",
  };
};

// --- Create the NDPA Tool ---
export const ndpaTool = createTool({
  id: "search-ndpa",
  description:
    "Search the Nigeria Data Protection Act (NDPA) 2023 for relevant sections.",
  inputSchema: z.object({
    question: z.string().describe("User's question about the NDPA"),
  }),
  outputSchema: z.object({
    part: z.string(),
    section_number: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const result = await findSectionQuery(context.question);
    return result;
  },
});
