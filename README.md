# Areeb Shahid Academy — AI Tutor for CBSE Classes 9–12

> **Public submission for the Mesh API Hackathon.**

Areeb Shahid Academy is an AI-powered study companion for Indian CBSE / NCERT students in Classes 9 through 12. It turns any topic, uploaded note, or full chapter into a clean, exam-ready, textbook-style explanation — with proper math rendering, tables for accounting entries, multilingual support (English, Hindi, Urdu), and follow-up questions for deeper understanding.

The tutor is powered by **Amazon Nova Micro** served through the **Mesh AI API**.

---

## ✨ Features

- **Three study modes**
  - **Upload your material** — drop a PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), or plain text file and get a personalized explanation.
  - **Ask about a topic** — pick class → (stream for 11/12) → subject → chapter, then ask any specific question.
  - **Full chapter explanation** — generate a complete NCERT-aligned study guide for any chapter.
- **Home search** — one search bar that auto-detects class and subject from the student's question.
- **Length control** — Quick Summary, Balanced Explanation, or Detailed Explanation (1500–2500+ words, exam-ready).
- **Follow-up questions** — every answer has a follow-up box that inherits the parent's length and context.
- **Proper rendering**
  - LaTeX math via KaTeX (`$…$` and `$$…$$`).
  - Markdown tables for journal entries, ledgers, balance sheets, and cash-flow statements.
  - Devanagari (Hindi) and Nastaliq (Urdu) Unicode text.
  - Wikimedia Commons diagrams embedded inline where the model is confident of the URL.
- **Curriculum coverage**
  - **Classes 9 & 10:** Math, Science, Social Science, English, Hindi, Urdu, AI (417), IT (402), Computer Applications (165).
  - **Classes 11 & 12:** three streams (Science, Commerce, Arts) with full subject and chapter lists, including Accountancy, Business Studies, Economics, Entrepreneurship, Computer Science (Sumita Arora), Physical Education, and more.
- **No login required.** Fully public, ready to share.

---

## 🧠 Mesh API Integration

All AI work happens server-side through the **Mesh AI Chat Completions API** using the `amazon/nova-micro-v1` model.

- **Endpoint:** `https://api.meshapi.ai/v1/chat/completions`
- **Model:** `amazon/nova-micro-v1`
- **Auth:** `Authorization: Bearer $MESH_API_KEY` (server-only)
- **Docs:** https://developers.meshapi.ai/docs/introduction/product-overview

Implementation lives in [`src/lib/mesh.functions.ts`](src/lib/mesh.functions.ts) as TanStack Start server functions (`createServerFn`). Each mode is its own typed RPC:

| Server function | Route | Purpose |
| --- | --- | --- |
| `explainAuto` | `/` (home search) | Detects class/subject from a free-form question. |
| `explainFromDocument` | `/upload` | Explains uploaded academic material. |
| `explainTopic` | `/topic` | Answers a specific topic question with class/stream/subject/chapter context. |
| `explainChapter` | `/chapter` | Produces a full NCERT-aligned chapter guide. |
| `followUp` | inline on every result | Continues an existing explanation without repeating it. |

### Prompt engineering highlights

The shared system prompt (`BASE_STYLE` in `mesh.functions.ts`) enforces:

- Textbook markdown output only — no raw code fences or `####` / `$$$` artifacts.
- Math **only** inside `$…$` / `$$…$$` — never `\[ … \]` or `( … )`.
- Sections adapt to subject: no forced "Formulas" or "Derivations" for History, English, or literature.
- Journal entries, ledgers, and financial statements **must** be markdown tables.
- Hindi in Devanagari, Urdu in Nastaliq — real Unicode, never transliteration.
- Wikimedia Commons diagrams embedded where they genuinely help; otherwise the diagram is described in words rather than linking a broken URL.

Length directives (`short`, `medium`, `detailed`) drive both the system prompt and `max_tokens` (1200 / 3000 / 6000) so a "Detailed Explanation" is genuinely exam-ready.

### Verifying Mesh is in use

1. Check the source: `src/lib/mesh.functions.ts` posts to `https://api.meshapi.ai/v1/chat/completions` with `model: "amazon/nova-micro-v1"`.
2. Live check: open DevTools → Network → ask any question → observe the POST to `/_serverFn/…`.
3. Kill-switch: remove `MESH_API_KEY` and every request fails with a clear error.
4. Dashboard: request counts appear on your Mesh AI dashboard.

---

## 🏗️ Tech Stack

- **Framework:** TanStack Start v1 (React 19 + Vite 7)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4, shadcn/ui, KaTeX
- **Markdown:** `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`
- **Document parsing:** `mammoth` (.docx), `xlsx` (.xlsx), `jszip` (.pptx)
- **AI:** Mesh AI Gateway → `amazon/nova-micro-v1`

---

## 🚀 Run Locally

### Prerequisites

- Node.js 20+ or Bun
- A Mesh AI API key from https://meshapi.ai

### Steps

```bash
# 1. Clone
git clone https://github.com/<your-username>/asc-academic-guide-ai.git
cd asc-academic-guide-ai

# 2. Install
bun install
# or: npm install

# 3. Configure the Mesh API key (server-only)
echo "MESH_API_KEY=sk-your-mesh-key-here" > .env

# 4. Start the dev server
bun run dev
# or: npm run dev

# App runs at http://localhost:8080
```

### Available scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Start the dev server with HMR. |
| `bun run build` | Production build. |
| `bun run preview` | Preview the production build locally. |
| `bun run lint` | ESLint over the project. |
| `bun run format` | Prettier over the project. |

---

## 📁 Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # App shell, head metadata, KaTeX + fonts
│   ├── index.tsx           # Home: welcome, search, 4 class tiles
│   ├── upload.tsx          # Mode 1: upload material
│   ├── topic.tsx           # Mode 2: filtered topic Q&A
│   └── chapter.tsx         # Mode 3: full chapter explanation
├── components/
│   ├── Header.tsx          # Persian-blue header + drawer menu
│   ├── CurriculumPicker.tsx# Class → stream → subject → chapter
│   ├── LengthButton.tsx    # Length selector with dropdown arrow
│   └── AiOutput.tsx        # Markdown + math + tables + follow-up
├── lib/
│   ├── mesh.functions.ts   # Mesh AI server functions
│   └── curriculum.ts       # NCERT syllabus data (9–12, all streams)
├── assets/                 # Logo + wordmark
├── styles.css              # Tailwind v4 theme (Persian Blue palette)
└── router.tsx              # TanStack Router setup
```

---

## 🎨 Design

- **Palette:** White + Persian Blue (`#1C39BB`).
- **Fonts:** Great Vibes (calligraphic "Welcome to"), Cinzel (academy name), Inter (body), Oswald (accents).
- **Logo:** Custom Areeb Shahid Academy wordmark on Persian Blue header, transparent-background wordmark on home page.

---

## 🔒 Security

- `MESH_API_KEY` is server-only, read from `process.env` inside `createServerFn` handlers. It is never exposed to the browser bundle.
- No user login, no PII stored, no database — the app is a stateless tutoring tool.

---

## 🏆 Hackathon Submission

This project is a **public submission for the Mesh API Hackathon**. It showcases how the Mesh AI Gateway and Amazon Nova Micro can power a real, useful education product for millions of Indian CBSE students — with careful prompt engineering, subject-aware formatting, multilingual output, and clean UX.

---

## 📄 License

MIT — free to use, learn from, and build upon.

Built with ❤️ for CBSE students, powered by Mesh AI.
