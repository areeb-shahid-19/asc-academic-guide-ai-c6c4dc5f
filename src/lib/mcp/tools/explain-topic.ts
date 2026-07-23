import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { explainTopic } from "@/lib/mesh.functions";

export default defineTool({
  name: "explain_topic",
  title: "Explain a CBSE/NCERT topic",
  description:
    "Get an exam-ready explanation of a specific topic or question for a CBSE/NCERT student (classes 9-12). Select class, subject, chapter, and ask a question.",
  inputSchema: {
    classKey: z
      .string()
      .describe("Class level: '9', '10', '11', or '12'."),
    stream: z
      .string()
      .optional()
      .describe("Stream for class 11/12: 'Science', 'Commerce', or 'Arts'. Leave empty for class 9/10."),
    subject: z.string().describe("Subject name, e.g. 'Mathematics', 'Physics', 'Accountancy'."),
    chapter: z.string().describe("Chapter or topic name from the NCERT syllabus."),
    prompt: z
      .string()
      .min(3)
      .describe("The student's specific question or what they want explained."),
    length: z
      .enum(["short", "medium", "detailed"])
      .default("medium")
      .describe("Response depth: 'short' (~250 words), 'medium' (~600 words), 'detailed' (1500-2500+ words, exam-ready)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ classKey, stream, subject, chapter, prompt, length }) => {
    const res = await explainTopic({
      data: { classKey, stream: stream ?? "", subject, chapter, prompt, length },
    });
    return { content: [{ type: "text", text: res.text }] };
  },
});
