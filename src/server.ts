import { AIChatAgent } from "@cloudflare/ai-chat";
import { routeAgentRequest } from "agents";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages, tool } from "ai";
import { z } from "zod";

export interface Env {
  AI: any;
}

export class ChatAgent extends AIChatAgent<Env> {
  maxPersistedMessages = 150;

  async onChatMessage(onFinish: () => void, options: any) {
    const workersai = createWorkersAI({ binding: this.env.AI });
    
    // Automatically extract internally persisted SQLite messages natively into the required model format.
    const modelMessages = await convertToModelMessages(this.messages);

    const systemPrompt = {
      role: "system",
      content: "You are an advanced edge-architect AI agent operating securely on V8 Isolates. You provide clear, concise responses and have full access to native environment tools to fulfill analytical calculations and external API retrieval requests."
    };

    const messagesWithSystem = [systemPrompt, ...modelMessages];

    const result = streamText({
      model: workersai("@cf/meta/llama-3-8b-instruct"),
      messages: messagesWithSystem,
      tools: {
        getWeather: tool({
          description: "Retrieve real-time mock weather conditions for a requested city location.",
          parameters: z.object({
            city: z.string().describe("The city name, e.g., 'Tokyo', 'London'"),
          }),
          execute: async ({ city }) => {
            return {
              location: city,
              temperature: `${Math.floor(Math.random() * 10) + 18}°C`,
              condition: "Clear skies",
              windSpeed: "12 km/h",
              timestamp: new Date().toISOString()
            };
          },
        }),
        calculate: tool({
          description: "Mathematically process an expression correctly securely without side effects.",
          parameters: z.object({
            expression: z.string().describe("Valid mathematical formula e.g. '(5000 * 3) / 10'"),
          }),
          execute: async ({ expression }) => {
            try {
              const sanitizedExpression = expression.replace(/[^0-9+\-*/(). ]/g, "");
              // Safe evaluation using constrained context
              const computedResult = new Function(`return ${sanitizedExpression}`)();
              return { expression: sanitizedExpression, result: computedResult };
            } catch (error) {
              return { error: "Computation syntax invalid or failed parsing routine." };
            }
          }
        })
      },
      onFinish: async () => {
        // Enforce the lifecycle constraint natively ensuring the transaction is finalized
        if (typeof onFinish === "function") {
          onFinish();
        }
      }
    });

    return result.toUIMessageStreamResponse();
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agentResponse = await routeAgentRequest(request, env);
    
    if (agentResponse) {
      return agentResponse;
    }
    
    return new Response(JSON.stringify({ error: "Agent endpoint not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
