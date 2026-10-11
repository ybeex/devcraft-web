export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: 'Engineering' | 'Product' | 'Community'
  readingTime: string
  publishedAt: string
  author: { name: string; role: string }
  featured?: boolean
  content: BlogBlock[]
}

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'quote'; text: string }

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-we-built-the-code-sandbox-from-scratch',
    title: 'Why we built our code execution sandbox from scratch',
    excerpt:
      'Every "Check Solution" button on every learning platform hides a hard infrastructure problem. Here is how we isolate, time-box, and sandbox untrusted code at scale.',
    category: 'Engineering',
    readingTime: '7 min read',
    publishedAt: 'June 18, 2026',
    author: { name: 'Amara Chukwu', role: 'Backend Engineer' },
    featured: true,
    content: [
      { type: 'p', text: 'When a learner clicks "Check Solution," their code has to run somewhere. That somewhere cannot be our API server — untrusted code with network access, unbounded memory, and no time limit is an outage waiting to happen.' },
      { type: 'h2', text: 'The constraints' },
      { type: 'p', text: 'We needed sub-5-second execution, network isolation, a hard memory ceiling, and support for four languages out of the gate: JavaScript, TypeScript, Python, and SQL.' },
      { type: 'code', language: 'typescript', code: `export async function executeCode(\n  code: string,\n  language: string,\n  stdin = '',\n): Promise<ExecutionResult> {\n  const languageId = LANGUAGE_IDS[language]\n  if (languageId === undefined) {\n    throw AppError.badRequest(\`Unsupported language: \${language}\`)\n  }\n  // ... sandboxed execution via isolated container\n}` },
      { type: 'p', text: 'Every submission runs in a freshly-provisioned container with networking disabled, a 128MB memory cap, and a 5-second CPU budget. If a learner writes an infinite loop, the sandbox kills it — their browser tab never even slows down.' },
      { type: 'quote', text: 'The sandbox should be invisible when it works and obvious when it protects you.' },
      { type: 'h2', text: 'What this unlocked' },
      { type: 'p', text: 'Real test execution, not string-matching a regex against expected output. Learners get actual pass/fail per assertion, with the same test runner output they\'d see locally.' },
    ],
  },
  {
    slug: 'designing-the-skill-tree-curriculum-map',
    title: 'Designing the skill-tree curriculum map',
    excerpt:
      'We replaced a flat lesson list with an interactive node graph. Here is the design reasoning, and why D3 — not Recharts — was the right tool for exactly one chart in our entire app.',
    category: 'Product',
    readingTime: '5 min read',
    publishedAt: 'June 10, 2026',
    author: { name: 'Tobi Adeyemi', role: 'Product Designer' },
    content: [
      { type: 'p', text: 'A flat list of lessons tells you what exists. It does not tell you what unlocks what, or how far you are from a meaningful milestone. We wanted the curriculum to look like what it actually is: a dependency graph.' },
      { type: 'h2', text: 'Why D3, and only for this' },
      { type: 'p', text: 'Recharts handles every standard chart type with a clear axis and legend. The skill tree is not a chart — it is a custom interactive diagram with no Recharts primitive that fits. Using D3 here, and nowhere else, keeps our dependency surface intentional rather than sprawling.' },
      { type: 'p', text: 'Locked nodes render at 50% opacity. Completed nodes get the XP-gem checkmark treatment instead of a generic checkmark, because completing a lesson is a reward moment, not a checkbox.' },
    ],
  },
  {
    slug: 'how-212-interview-questions-get-reviewed',
    title: 'How we review all 212 interview questions before they ship',
    excerpt:
      'Every question in our interview prep bank goes through a three-stage review before it is published. Here is the process, and why we rejected our first 40 drafts.',
    category: 'Community',
    readingTime: '4 min read',
    publishedAt: 'May 29, 2026',
    author: { name: 'Chidi Okonkwo', role: 'Curriculum Lead' },
    content: [
      { type: 'p', text: 'A bad interview question is worse than no question — it teaches a wrong mental model with false confidence. Our first batch of 40 draft questions got rejected entirely because they tested trivia, not understanding.' },
      { type: 'h2', text: 'The three-stage review' },
      { type: 'p', text: 'Every question is written by an engineer who has actually been asked it in a real interview, reviewed by a second engineer for technical accuracy, and then user-tested with five learners to confirm the explanation actually teaches the concept rather than just stating the answer.' },
    ],
  },
  {
    slug: 'why-frontend-and-backend-only',
    title: 'Why we teach only Frontend and Backend — nothing else',
    excerpt:
      'No data science detour. No mobile track. No Python-for-everything course. Here is the case for staying razor-focused on two disciplines, done with real depth.',
    category: 'Product',
    readingTime: '6 min read',
    publishedAt: 'May 14, 2026',
    author: { name: 'Tobi Adeyemi', role: 'Product Designer' },
    content: [
      { type: 'p', text: 'Every competitor in this space eventually adds a third track, then a fourth, chasing breadth. We made the opposite bet: two tracks, both built to the depth of a specialization, not a survey course.' },
    ],
  },
  {
    slug: 'building-the-ai-tutor-without-giving-away-answers',
    title: 'Building an AI tutor that refuses to give you the answer',
    excerpt:
      'Our AI hint system uses the Socratic method by design — it will not write code for you, even if you ask twice. Here is the prompt engineering behind that restraint.',
    category: 'Engineering',
    readingTime: '6 min read',
    publishedAt: 'April 30, 2026',
    author: { name: 'Amara Chukwu', role: 'Backend Engineer' },
    content: [
      { type: 'p', text: 'The easiest AI tutor to build just answers the question. The useful one teaches you to find the answer yourself. Getting an LLM to consistently choose the second behavior over the first took real iteration.' },
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getFeaturedPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0]!
}

export function getOtherPosts(): BlogPost[] {
  return BLOG_POSTS.filter((p) => !p.featured)
}
