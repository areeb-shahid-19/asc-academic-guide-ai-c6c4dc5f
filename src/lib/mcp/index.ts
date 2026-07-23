import { defineMcp } from "@lovable.dev/mcp-js";
import explainTopic from "./tools/explain-topic";
import explainChapter from "./tools/explain-chapter";
import explainAuto from "./tools/explain-auto";
import explainFromDocument from "./tools/explain-from-document";

export default defineMcp({
  name: "areeb-shahid-academy",
  title: "Areeb Shahid Academy",
  version: "0.1.0",
  instructions:
    "Tutoring tools for CBSE/NCERT students (classes 9-12) powered by Areeb Shahid Academy. Use `explain_auto` when the class/subject is unknown, `explain_topic` for a focused question within a known class/subject/chapter, `explain_chapter` for a full chapter study guide, and `explain_from_document` when the student has provided extracted text from their own study material.",
  tools: [explainAuto, explainTopic, explainChapter, explainFromDocument],
});
