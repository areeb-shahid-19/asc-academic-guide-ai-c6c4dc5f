import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { explainAuto } from "@/lib/mesh.functions";

export default defineTool({
  name: "explain_auto",
  title: "Auto-detect class and explain",
  description:
    "Answer a CBSE/NCERT student question without knowing their class or subject in advance. The tutor infers the most likely class/subject and gives a level-appropriate explanation.",
  inputSchema: {
    prompt: z.string().min(3).describe("The student's question or topic in natural language."),
    length: z
      .enum(["short", "medium", "detailed"])
      .default("medium")
      .describe("Response depth: 'short', 'medium', or 'detailed'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ prompt, length }) => {
    const res = await explainAuto({ data: { prompt, length } });
    return { content: [{ type: "text", text: res.text }] };
  },
});
