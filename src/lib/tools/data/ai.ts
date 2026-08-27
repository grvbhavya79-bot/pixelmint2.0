import type { ToolDefinition } from "../types";

/** AI Tools — powered by a server-side AI model through /api/ai. */
export const AI_TOOLS: ToolDefinition[] = [
  {
    slug: "ai-text-summarizer",
    name: "AI Text Summarizer",
    category: "ai",
    description:
      "Paste any long article, email or report and get a crisp summary with the key points in seconds.",
    longDescription:
      "Turn walls of text into a clear, readable summary. Paste an article, meeting note, essay or email thread, pick your preferred length, and the AI Text Summarizer returns a tight summary plus the essential points — great for research, studying and inbox triage.",
    tags: ["ai summarizer", "summarize text", "article summary", "tldr", "ai tools"],
    popular: true,
    component: "AiTool",
    props: {
      task: "summarize",
      inputLabel: "Paste your text",
      inputPlaceholder: "Paste an article, email, report or any long text (up to 10,000 characters)…",
      inputHint: "Works best with 200+ characters of text",
      buttonLabel: "Summarize with AI",
      minLength: 120,
      options: [
        { key: "length", label: "Summary length", choices: ["Short", "Medium", "Detailed"] },
      ],
    },
    process: "server",
    icon: "Sparkles",
    faqs: [
      {
        q: "Is the AI Text Summarizer free to use?",
        a: "Yes. The summarizer is completely free with a fair daily limit, so it stays fast and available for everyone. No account or credit card is needed — just paste your text and go.",
      },
      {
        q: "How much text can I summarize at once?",
        a: "You can paste up to 10,000 characters at a time, which covers most news articles, blog posts, reports and long emails. For longer documents, summarize them section by section.",
      },
      {
        q: "What is the difference between Short, Medium and Detailed?",
        a: "Short gives you a two-to-three sentence bottom line, Medium adds a short paragraph with the main arguments, and Detailed includes a full paragraph plus a list of key points.",
      },
      {
        q: "Do you store the text I paste in?",
        a: "No. Your text is sent securely to the AI model only for the moment it takes to generate your summary, and nothing is kept afterwards. See our Privacy Policy for the full picture.",
      },
    ],
  },
  {
    slug: "ai-writing-improver",
    name: "AI Writing Improver",
    category: "ai",
    description:
      "Fix grammar, tighten wording and sharpen tone — paste a draft and get a polished version back.",
    longDescription:
      "Make anything you write clearer and more confident. Paste a rough draft — an email, bio, product description or paragraph — choose a tone, and the AI Writing Improver returns a polished rewrite that keeps your meaning while fixing grammar, flow and wordiness.",
    tags: ["ai writing", "grammar checker", "rewrite text", "polish email", "ai editor"],
    component: "AiTool",
    props: {
      task: "improve",
      inputLabel: "Paste your draft",
      inputPlaceholder: "Paste the text you want to improve (up to 10,000 characters)…",
      inputHint: "Any draft works — emails, bios, paragraphs, product copy",
      buttonLabel: "Improve my writing",
      minLength: 40,
      options: [
        { key: "tone", label: "Tone", choices: ["Professional", "Friendly", "Concise", "Confident"] },
      ],
    },
    process: "server",
    icon: "SquarePen",
    faqs: [
      {
        q: "Will the AI rewrite change what I meant to say?",
        a: "No. The improver is instructed to preserve your meaning, facts and intent. It fixes grammar, sharpens wording and adjusts tone — but the ideas stay yours, and you always get your original back next to the rewrite.",
      },
      {
        q: "Which tones can I choose from?",
        a: "Professional keeps things business-appropriate, Friendly adds warmth, Concise trims every wasted word, and Confident strengthens hedging language like 'I think maybe'.",
      },
      {
        q: "Can I use it for emails and business messages?",
        a: "Absolutely — short professional writing is one of its best use cases. Paste your draft, pick a tone, and compare the rewrite against your original before copying it out.",
      },
      {
        q: "Does it check spelling and grammar too?",
        a: "Yes. Grammar, spelling and punctuation are corrected as part of every rewrite, along with sentence flow and word choice, so you get a full polish in one pass.",
      },
    ],
  },
  {
    slug: "ai-idea-generator",
    name: "AI Idea Generator",
    category: "ai",
    description:
      "Type any topic and instantly get ten fresh, usable ideas — for content, names, features or projects.",
    longDescription:
      "Beat the blank page. Enter a topic — a blog theme, product name, YouTube video, side project or campaign — and the AI Idea Generator returns ten specific, actionable ideas you can run with right away, each with a one-line explanation of why it works.",
    tags: ["ai ideas", "brainstorming", "idea generator", "content ideas", "name ideas"],
    component: "AiTool",
    props: {
      task: "ideas",
      inputLabel: "What do you need ideas for?",
      inputPlaceholder: "e.g. YouTube videos about home cooking, names for a coffee brand, features for a note-taking app…",
      inputHint: "Be as specific as you like — more context gives better ideas",
      buttonLabel: "Generate 10 ideas",
      minLength: 8,
      options: [
        { key: "kind", label: "Kind of ideas", choices: ["Creative", "Practical", "Bold"] },
      ],
    },
    process: "server",
    icon: "Lightbulb",
    faqs: [
      {
        q: "What can I use the AI Idea Generator for?",
        a: "Anything that starts with a blank page: blog posts, video topics, product names, startup ideas, marketing campaigns, app features, gifts and party themes. If you can describe the topic, it can brainstorm for it.",
      },
      {
        q: "Are the ideas original?",
        a: "The ideas are generated fresh for your specific prompt, so they are tailored to your topic rather than copied from a list. Treat them as starting points and remix them into your own work.",
      },
      {
        q: "What do Creative, Practical and Bold mean?",
        a: "Creative favors unexpected angles and fresh combinations. Practical favors ideas you can execute this week with minimal resources. Bold favors ambitious, attention-grabbing swings.",
      },
      {
        q: "Can I generate ideas more than once?",
        a: "Yes — run it as many times as you like within the fair-use limit. Each run produces a different batch, so a second or third attempt often surfaces an angle the first one missed.",
      },
    ],
  },
];
