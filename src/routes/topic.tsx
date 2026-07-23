import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Textarea } from "@/components/ui/textarea";
import { AiOutput } from "@/components/AiOutput";
import { CurriculumPicker, type PickerValue } from "@/components/CurriculumPicker";
import { LengthButton, type LengthChoice } from "@/components/LengthButton";
import { explainTopic } from "@/lib/mesh.functions";

export const Route = createFileRoute("/topic")({
  head: () => ({
    meta: [
      { title: "Ask a topic — Areeb Shahid Academy" },
      {
        name: "description",
        content:
          "Pick your class, subject and chapter, then ask any question. Get a personalized NCERT-level explanation.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    classKey: typeof s.classKey === "string" ? s.classKey : "",
    stream: typeof s.stream === "string" ? s.stream : "",
    subject: typeof s.subject === "string" ? s.subject : "",
    chapter: typeof s.chapter === "string" ? s.chapter : "",
  }),
  component: TopicPage,
});

function TopicPage() {
  const search = Route.useSearch();
  const run = useServerFn(explainTopic);
  const [picker, setPicker] = useState<PickerValue>({
    classKey: search.classKey,
    stream: search.stream,
    subject: search.subject,
    chapter: search.chapter,
  });
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastLength, setLastLength] = useState<LengthChoice>("medium");

  const ready = picker.classKey && picker.subject && picker.chapter;

  async function submit(length: LengthChoice) {
    setError(null);
    setText("");
    if (!ready) {
      setError("Please select class, subject and chapter first.");
      return;
    }
    if (prompt.trim().length < 3) {
      setError("Type what you'd like to learn about.");
      return;
    }
    setLastLength(length);
    setLoading(true);
    try {
      const res = await run({ data: { ...picker, prompt, length } });
      setText(res.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const placeholder = examplePlaceholder(picker.subject, picker.chapter);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--persian-blue)]">Ask about a topic</h1>
          <p className="text-muted-foreground">
            Filter by class, subject and chapter — then ask any question. The AI will build a
            personalized, exam-ready answer at your level.
          </p>
        </div>

        <div className="space-y-5 rounded-lg border bg-card p-5">
          <CurriculumPicker value={picker} onChange={setPicker} />

          {ready && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Your question</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholder}
                className="min-h-[100px]"
              />
              <LengthButton
                label="Get explanation"
                loading={loading}
                disabled={prompt.trim().length < 3}
                onChoose={submit}
              />
            </div>
          )}
        </div>

        <AiOutput
          loading={loading}
          error={error}
          text={text}
          length={lastLength}
          emptyHint="Pick a chapter and ask a question to see your explanation here."
        />
      </main>
    </div>
  );
}

function examplePlaceholder(subject: string, chapter: string): string {
  if (!subject) return "e.g. Explain the topic in simple words with an example";
  const s = subject.toLowerCase();
  if (s.includes("account"))
    return `e.g. Explain the journal entries for ${chapter || "this chapter"} with a worked example in table form`;
  if (s.includes("business")) return `e.g. Explain the key principles in ${chapter || "this chapter"} with real-world examples`;
  if (s.includes("econom")) return `e.g. Explain ${chapter || "this concept"} with graphs and a numerical example`;
  if (s.includes("math")) return `e.g. Explain the theorem in ${chapter || "this chapter"} with a full proof and 2 solved examples`;
  if (s.includes("phys")) return `e.g. Derive the main formula in ${chapter || "this chapter"} and solve one numerical`;
  if (s.includes("chem")) return `e.g. Explain the mechanism/reactions in ${chapter || "this chapter"} with diagrams`;
  if (s.includes("bio")) return `e.g. Explain the process in ${chapter || "this chapter"} with a labelled diagram`;
  if (s.includes("history")) return `e.g. Explain the causes and consequences discussed in ${chapter || "this chapter"}`;
  if (s.includes("polit")) return `e.g. Explain the concepts in ${chapter || "this chapter"} with examples`;
  if (s.includes("geo")) return `e.g. Explain ${chapter || "this topic"} with a diagram/map`;
  if (s.includes("english")) return `e.g. Give a summary, themes and character analysis for ${chapter || "this chapter"}`;
  if (s.includes("hindi")) return `e.g. ${chapter || "इस पाठ"} का सारांश और मुख्य प्रश्न-उत्तर समझाइए`;
  if (s.includes("urdu")) return `e.g. ${chapter || "اس سبق"} کا خلاصہ اور اہم سوال جواب سمجھائیے`;
  if (s.includes("comput")) return `e.g. Explain ${chapter || "this topic"} with example code and expected output`;
  if (s.includes("entrepren")) return `e.g. Explain ${chapter || "this chapter"} with a real Indian startup example`;
  return `e.g. Explain the main ideas of ${chapter || "this chapter"} with examples`;
}
