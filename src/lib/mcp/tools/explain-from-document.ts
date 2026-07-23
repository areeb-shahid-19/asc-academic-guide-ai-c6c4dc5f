import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { explainFromDocument } from "@/lib/mesh.functions";

export default defineTool({
  name: "explain_from_document",
  title: "Explain uploaded study material",
  description:
    "Given the plain-text content of a student's academic material (extracted from a PDF, DOCX, PPTX, XLSX, or pasted notes), produce a clear, textbook-style explanation. Optionally answer a specific question about the material.",
  inputSchema: {
    content: z
      .string()
      .min(20)
      .describe("The extracted plain-text content of the student's uploaded material (up to ~80k chars)."),
    question: z
      .string()
      .optional()
      .describe("Optional specific question about the material."),
    length: z
      .enum(["short", "medium", "detailed"])
      .default("medium")
      .describe("Response depth: 'short', 'medium', or 'detailed'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ content, question, length }) => {
    const res = await explainFromDocument({ data: { content, question, length } });
    return { content: [{ type: "text", text: res.text }] };
  },
});
