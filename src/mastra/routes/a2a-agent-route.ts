import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

type Part =
  | {
      kind: "text";
      text: string;
      data: null;
      file_url: null;
    }
  | {
      kind: "data";
      data: any;
      text: null;
      file_url: null;
    };

interface Artifact {
  artifactId: string;
  name: string;
  parts: Array<Part>;
}

function createUnknownMethodResponse(requestId?: string) {
  const taskId = randomUUID();
  const contextId = randomUUID();
  const messageId = randomUUID();
  const artifactId = randomUUID();

  const errorMessage = "Unknown method. Use 'message/send' or 'help'.";

  return {
    jsonrpc: "2.0",
    id: requestId || "",
    result: {
      id: taskId,
      contextId: contextId,
      status: {
        state: "failed",
        timestamp: new Date().toISOString(),
        message: {
          kind: "message",
          role: "agent",
          parts: [
            {
              kind: "text",
              text: errorMessage,
              data: null,
              file_url: null,
            },
          ],
          messageId: messageId,
          taskId: null,
          metadata: null,
        },
      },
      artifacts: [
        {
          artifactId: artifactId,
          name: "assistantResponse",
          parts: [
            {
              kind: "text",
              text: errorMessage,
              data: null,
              file_url: null,
            },
          ],
        },
      ],
      history: [],
      kind: "task",
    },
  };
}

export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async c => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");

      let body;
      try {
        // Try to parse JSON body - this will fail if no body is provided
        body = await c.req.json();
      } catch (parseError) {
        // Handle empty body or invalid JSON by returning "Unknown method" response
        return c.json(createUnknownMethodResponse());
      }

      // If body is empty object or null/undefined, return "Unknown method"
      if (!body || Object.keys(body).length === 0) {
        return c.json(createUnknownMethodResponse());
      }

      const { jsonrpc, id: requestId, method, params } = body;

      // Handle missing method or unsupported method
      if (!method || method !== "message/send") {
        return c.json(createUnknownMethodResponse(requestId));
      }

      // Validate JSON-RPC 2.0 format for valid requests
      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: {
              code: -32600,
              message:
                'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
          },
          400
        );
      }

      const agent = mastra.getAgent(agentId);

      if (!agent) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: `Agent '${agentId}' not found`,
            },
          },
          404
        );
      }

      // Extract messages from params
      const { message, messages, contextId, taskId } = params || {};

      let messagesList = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }

      // Convert A2A messages to Mastra format
      const mastraMessages = messagesList.map(msg => {
        let content = "";

        if (msg.parts && Array.isArray(msg.parts)) {
          content = msg.parts
            .map(
              (part: { kind: "text" | "data"; text?: string; data?: any }) => {
                if (part.kind === "text") return part.text || "";
                if (part.kind === "data") {
                  // Handle nested data array (like in your example)
                  if (Array.isArray(part.data)) {
                    return part.data
                      .map((dataItem: any) => {
                        if (dataItem.kind === "text")
                          return dataItem.text || "";
                        return JSON.stringify(dataItem);
                      })
                      .join("\n");
                  }
                  return JSON.stringify(part.data);
                }
                return "";
              }
            )
            .join("\n");
        }

        return {
          role: msg.role || "user",
          content: content,
          // Preserve metadata if needed
          metadata: msg.metadata,
        };
      });

      const response = await agent.generate(mastraMessages);
      const agentText = response.text || "";

      // Build artifacts array
      const artifacts: Array<Artifact> = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [
            { kind: "text", text: agentText, data: null, file_url: null },
          ],
        },
      ];

      // Add tool results as artifacts
      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map(result => ({
            kind: "data",
            data: result,
            text: null,
            file_url: null,
          })),
        });
      }

      // Build conversation history with proper structure
      const history = [
        ...messagesList.map(msg => ({
          kind: "message",
          role: msg.role,
          parts: msg.parts.map((part: Part) => ({
            ...part,
            data: part.kind === "text" ? null : part.data,
            file_url: null,
          })),
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
          metadata: msg.metadata || null,
        })),
        {
          kind: "message",
          role: "agent",
          parts: [
            {
              kind: "text",
              text: agentText,
              data: null,
              file_url: null,
            },
          ],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
          metadata: null,
        },
      ];

      // Return A2A-compliant response
      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: "agent",
              parts: [
                {
                  kind: "text",
                  text: agentText,
                  data: null,
                  file_url: null,
                },
              ],
              kind: "message",
              taskId: taskId || randomUUID(),
              metadata: null,
            },
          },
          artifacts,
          history,
          kind: "task",
        },
      });
    } catch (error: any) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: error.message },
          },
        },
        500
      );
    }
  },
});
