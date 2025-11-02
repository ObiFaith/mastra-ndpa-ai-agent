import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { ndpaWorkflow } from "./workflows/ndpa-workflow";
import { ndpaAgent } from "./agents/ndpa-agent";
import {
  ndpaToolAccuracyScorer,
  completenessScorer,
  ndpaRelevanceScorer,
} from "./scorers/ndpa-scorer";

export const mastra = new Mastra({
  workflows: { ndpaWorkflow },
  agents: { ndpaAgent },
  scorers: { ndpaToolAccuracyScorer, completenessScorer, ndpaRelevanceScorer },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
