import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCirclePlus, Send } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { LengthChoice } from "@/components/LengthButton";
import { followUp } from "@/lib/mesh.functions";

/**
 * Normalize the many wrong math shapes Mesh AI produces into valid KaTeX.
 * The model frequently:
 *   - uses `\[ ... \]`, `\( ... \)`, or bare `[ ... ]` / `( ... )` as delimiters
 *   - emits a raw LaTeX line right next to a text-rendered copy, e.g.
 *     `n=m+1n=m+1` (so the same tokens appear back-to-back)
 *   - mixes stray `$...$` inline math inside a larger expression
 *   - dumps subscripts like `ΔΦBΔΦB` or `dΦBdtdtdΦB`
 *   - leaves bare `\command` sequences outside any `$...$`
 * We fix as much as we safely can without corrupting real prose.
 */
function normalizeMath(input: string): string {
  let s = input;

  // 1. Convert \[..\] and \(..\) delimiters to $$..$$ / $..$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, body) => `$$${body}$$`);
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_m, body) => `$${body}$`);

  // 2. Bracket-delimited math ( [ ... ] or ( ... ) containing a LaTeX command)
  s = s.replace(
    /(^|[\s>])\[\s*([^\[\]\n]*\\[a-zA-Z]+[^\[\]]*?)\s*\]/g,
    (_m, pre, body) => `${pre}$$${body}$$`,
  );
  s = s.replace(
    /(^|[\s>])\(\s*([^()\n]*\\[a-zA-Z]+[^()]*?)\s*\)/g,
    (_m, pre, body) => `${pre}$${body}$`,
  );

  // 3. Collapse "X X" duplicates that Mesh emits (raw+rendered pair). This
  //    covers cases like `n=m+1n=m+1`, `ΔΦBΔΦB`, `35.4335.43`. We match a
  //    run of 2–40 non-space chars that is repeated immediately.
  s = s.replace(
    /([A-Za-z0-9_+\-=.^{}()\\\/·×÷≈≠≤≥Δδϕφμπθλσωαβγη\u0900-\u097F\u0600-\u06FF\u2070-\u209F]{2,40})\1/g,
    "$1",
  );

  // 4. Strip stray inline `$...$` fragments that appear INSIDE an already
  //    unwrapped arithmetic expression on the same line, e.g.
  //    `= $35 \times 0.7578$ + $37 \times 0.2422$ = 26.52`. Wrap the whole
  //    right-hand side in one $$...$$ block instead.
  s = s.replace(/([=:])\s*((?:\$[^$\n]+\$[^\n$]*){2,})/g, (_m, eq, body) => {
    const cleaned = body.replace(/\$/g, "");
    return `${eq} $${cleaned.trim()}$`;
  });

  // 5. Wrap orphan LaTeX commands sitting in plain text: a line that starts
  //    with (or heavily contains) `\command` but has no `$` around it.
  s = s.replace(/(^|\n)([^\n$]*\\[a-zA-Z]{2,}[^\n$]*?)(?=\n|$)/g, (m, pre, line) => {
    // If the line already has $, or looks like normal prose with only a
    // stray escape, don't touch it.
    if (line.includes("$")) return m;
    const cmdCount = (line.match(/\\[a-zA-Z]+/g) || []).length;
    if (cmdCount === 0) return m;
    // Whole line is math-heavy — wrap as block math.
    return `${pre}$$${line.trim()}$$`;
  });

  return s;
}

function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        img: ({ node: _node, alt, src, ...props }) => (
          <figure className="my-6 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              {...props}
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              className="max-h-96 w-auto rounded-lg border object-contain shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const cap = (e.currentTarget as HTMLImageElement)
                  .nextElementSibling as HTMLElement | null;
                if (cap) cap.style.display = "none";
              }}
            />
            {alt ? (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                {alt}
              </figcaption>
            ) : null}
          </figure>
        ),
        table: ({ node: _node, ...props }) => (
          <div className="my-6 overflow-x-auto">
            <table {...props} className="w-full border-collapse text-sm" />
          </div>
        ),
      }}
    >
      {normalizeMath(text)}
    </ReactMarkdown>
  );
}

function FollowUpBox({
  previousAnswer,
  length,
}: {
  previousAnswer: string;
  length: LengthChoice;
}) {
  const run = useServerFn(followUp);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (question.trim().length < 2) {
      setError("Type your follow-up question first.");
      return;
    }
    setError(null);
    setAnswer("");
    setLoading(true);
    try {
      const res = await run({ data: { previousAnswer, question, length } });
      setAnswer(res.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--persian-blue)]">
        <MessageCirclePlus className="h-4 w-4" />
        Ask a follow-up about this answer
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && question.trim()) ask();
          }}
          placeholder="e.g. Why is this sign negative in step 3?"
          className="h-11"
        />
        <button
          type="button"
          onClick={ask}
          disabled={loading || !question.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--persian-blue)] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[color:var(--persian-blue)]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>Ask</span>
        </button>
      </div>
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[color:var(--persian-blue)]" />
          Working on your follow-up…
        </div>
      )}
      {answer && (
        <div className="space-y-4">
          <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-[color:var(--persian-blue)] prose-strong:text-[color:var(--persian-blue)]">
            <Markdown text={answer} />
          </article>
          {/* Recursive follow-up: after this answer, allow another follow-up. */}
          <FollowUpBox previousAnswer={answer} length={length} />
        </div>
      )}
    </div>
  );
}

export function AiOutput({
  loading,
  error,
  text,
  emptyHint,
  showFollowUp = true,
  length = "medium",
}: {
  loading: boolean;
  error: string | null;
  text: string;
  emptyHint?: string;
  showFollowUp?: boolean;
  length?: LengthChoice;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-6 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--persian-blue)]" />
        <span>Thinking… searching NCERT-level sources and preparing your explanation.</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!text) {
    return emptyHint ? (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        {emptyHint}
      </div>
    ) : null;
  }
  return (
    <div className="space-y-4">
      <article className="prose prose-slate max-w-none rounded-lg border bg-card p-6 dark:prose-invert prose-headings:text-[color:var(--persian-blue)] prose-strong:text-[color:var(--persian-blue)] prose-img:mx-auto prose-img:rounded-lg prose-img:border prose-img:shadow-sm prose-img:my-6 prose-img:max-h-96 prose-img:object-contain">
        <Markdown text={text} />
      </article>
      {showFollowUp && <FollowUpBox previousAnswer={text} length={length} />}
    </div>
  );
}
