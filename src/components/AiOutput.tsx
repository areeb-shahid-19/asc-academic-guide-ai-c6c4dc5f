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

const greekToLatex: Record<string, string> = {
  Δ: "\\Delta",
  δ: "\\delta",
  Φ: "\\Phi",
  φ: "\\phi",
  μ: "\\mu",
  λ: "\\lambda",
  θ: "\\theta",
  π: "\\pi",
  Ω: "\\Omega",
  ω: "\\omega",
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
};

function cleanMathExpression(input: string): string {
  let body = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\$+/g, "")
    .replace(/`+/g, "")
    .replace(/\\,/g, " ")
    .trim();

  body = body
    .replace(/∆/g, "Δ")
    .replace(/3\s*λ\s*2\s*2\s*3\s*λ\s*/g, "\\frac{3\\lambda}{2}")
    .replace(/Δ\s*Φ\s*B/g, "\\Delta \\Phi_B")
    .replace(/Φ\s*B/g, "\\Phi_B")
    .replace(/d\s*Φ\s*B\s*d\s*t\s*d\s*t\s*d\s*Φ\s*B/gi, "\\frac{d\\Phi_B}{dt}")
    .replace(/d\s*Φ\s*B\s*d\s*t/gi, "\\frac{d\\Phi_B}{dt}")
    .replace(/d\s*t\s*d\s*Φ\s*B/gi, "\\frac{d\\Phi_B}{dt}")
    .replace(/\bE\s*E\b/g, "E")
    .replace(/\baa\b/g, "a")
    .replace(/([λμθΔΦπΩωαβγδφ])\1+/g, "$1")
    .replace(/([A-Za-z0-9_+\-=.^{}()\\\/·×÷≈≠≤≥Δδϕφμπθλσωαβγη]{2,40})\1/g, "$1");

  body = body.replace(/[ΔδΦφμλθπΩωαβγ]/g, (char) => greekToLatex[char] ?? char);
  body = body
    .replace(/\\Phi\s*B\b/g, "\\Phi_B")
    .replace(/\\cos\s*\(([^)]+)\)/g, "\\cos $1")
    .replace(/\\sin\s*\(([^)]+)\)/g, "\\sin $1")
    .replace(/=\s*(n\s*-\s*\\frac\{1\}\{2\})\s*\\lambda/g, "= ($1)\\lambda")
    .replace(/=\s*(n\s*\+\s*\\frac\{1\}\{2\})\s*\\lambda/g, "= ($1)\\lambda")
    .replace(/\s+/g, " ")
    .trim();

  return body;
}

function isMathOnlyLine(line: string): boolean {
  const raw = line.trim();
  if (!raw || raw === "$" || raw === "$$" || raw.startsWith("|") || raw.startsWith("#")) {
    return false;
  }

  const body = raw.replace(/^([-*+]\s+|\d+[.)]\s+)/, "");
  const withoutCommands = body
    .replace(/\\text\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\{[^}]*\}/g, "");
  const hasLongProse = /[A-Za-z]{4,}/.test(withoutCommands);
  const hasMathSignal = /(?:\$|\\[a-zA-Z]+|[=+\-×÷≈≠≤≥^_]|[ΔδΦφμλθπΩωαβγ]|\b(?:sin|cos|tan|log|lim)\b)/.test(body);
  const startsAsFormula = /^[\$\\A-Za-z0-9_{}^+\-()[\]ΔδΦφμλθπΩωαβγ]+\s*(?:=|≈|≤|≥|<|>)/.test(body);

  return hasMathSignal && !hasLongProse && (startsAsFormula || body.includes("=") || body.startsWith("$") || body.includes("\\frac"));
}

function normalizeMathLine(line: string): string {
  const trimmed = line.trim();
  if (trimmed === "$" || trimmed === "$$") return "";

  const prefixMatch = line.match(/^(\s*(?:[-*+]\s+|\d+[.)]\s+)?)/);
  const prefix = prefixMatch?.[0] ?? "";
  const body = line.slice(prefix.length);

  if (!isMathOnlyLine(body)) return line;

  const cleaned = cleanMathExpression(body);
  if (!cleaned) return "";
  return `${prefix}$$${cleaned}$$`;
}

/**
 * Normalize the wrong math shapes Mesh AI sometimes produces into valid KaTeX.
 * This turns mixed fragments like `\Delta = $n - \frac{1}{2}$\lambda` into
 * display math and collapses repeated raw/rendered duplicates like `λλ`.
 */
function normalizeMath(input: string): string {
  let s = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/^(```|~~~).*$/gm, "")
    .replace(/^(#{1,6})(\S)/gm, "$1 $2")
    .replace(/\${3,}/g, "$$")
    .replace(/%+\s*\$\$/g, "$$")
    .replace(/3\s*λ\s*2\s*2\s*3\s*λ\s*/g, "$\\frac{3\\lambda}{2}$")
    .replace(/([λμθΔΦπΩωαβγδφ])\1+/g, "$1")
    .replace(/\baa\b/g, "a");

  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, body) => `$$${cleanMathExpression(body)}$$`);
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_m, body) => `$${cleanMathExpression(body)}$`);
  s = s.replace(
    /(^|[\s>])\[\s*([^\[\]\n]*\\[a-zA-Z]+[^\[\]]*?)\s*\]/g,
    (_m, pre, body) => `${pre}$$${cleanMathExpression(body)}$$`,
  );

  s = s.replace(
    /([A-Za-z0-9_+\-=.^{}()\\\/·×÷≈≠≤≥Δδϕφμπθλσωαβγη\u0900-\u097F\u0600-\u06FF\u2070-\u209F]{2,40})\1/g,
    "$1",
  );

  s = s.replace(/([=:])\s*((?:\$[^$\n]+\$[^\n$]*){2,})/g, (_m, eq, body) => {
    const cleaned = cleanMathExpression(body);
    return `${eq} $${cleaned}$`;
  });

  s = s
    .split("\n")
    .map(normalizeMathLine)
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");

  s = s.replace(/(^|\n)([^\n$]*\\[a-zA-Z]{2,}[^\n$]*?)(?=\n|$)/g, (m, pre, line) => {
    const cmdCount = (line.match(/\\[a-zA-Z]+/g) || []).length;
    if (line.includes("$") || cmdCount === 0 || /[A-Za-z]{4,}/.test(line.replace(/\\[a-zA-Z]+/g, ""))) {
      return m;
    }
    return `${pre}$$${cleanMathExpression(line)}$$`;
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
            <img
              {...props}
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              className="max-h-96 w-auto rounded-lg border object-contain shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const cap = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement | null;
                if (cap) cap.style.display = "none";
              }}
            />
            {alt ? <figcaption className="mt-2 text-center text-xs text-muted-foreground">{alt}</figcaption> : null}
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

function FollowUpBox({ previousAnswer, length }: { previousAnswer: string; length: LengthChoice }) {
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
    <div className="space-y-4 rounded-lg border bg-card p-5">
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
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{emptyHint}</div>
    ) : null;
  }
  return (
    <div className="space-y-4">
      <article className="prose prose-slate max-w-none rounded-lg border bg-card p-6 dark:prose-invert prose-headings:text-[color:var(--persian-blue)] prose-strong:text-[color:var(--persian-blue)] prose-img:mx-auto prose-img:my-6 prose-img:max-h-96 prose-img:rounded-lg prose-img:border prose-img:object-contain prose-img:shadow-sm">
        <Markdown text={text} />
      </article>
      {showFollowUp && <FollowUpBox previousAnswer={text} length={length} />}
    </div>
  );
}