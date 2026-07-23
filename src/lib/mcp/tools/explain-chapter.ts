import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { explainChapter } from "@/lib/mesh.functions";

export default defineTool({
  name: "explain_chapter",
  title: "Explain a full NCERT chapter",
  description:
    "Generate a complete NCERT-aligned study guide for a full chapter: concepts, formulas, derivations, worked examples, NCERT exercise solutions, and revision notes.",
  inputSchema: {
    classKey: z.string().describe("Class level: '9', '10', '11', or '12'."),
    stream: z
      .string()
      .optional()
      .describe("Stream for class 11/12: 'Science', 'Commerce', or 'Arts'. Leave empty for class 9/10."),
    subject: z.string().describe("Subject name."),
    chapter: z.string().describe("Chapter name from the NCERT syllabus."),
    length: z
      .enum(["short", "medium", "detailed"])
      .default("detailed")
      .describe("Response depth. 'detailed' produces a full textbook-style chapter (1500-2500+ words)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ classKey, stream, subject, chapter, length }) => {
    const res = await explainChapter({
      data: { classKey, stream: stream ?? "", subject, chapter, length },
    });
    return { content: [{ type: "text", text: res.text }] };
  },
});
