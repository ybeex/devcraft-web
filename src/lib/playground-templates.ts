import type { WebModeContent } from '@/lib/api/playground'

interface WebTemplate {
  label: string
  language: 'web'
  title: string
  content: WebModeContent
}

interface CodeTemplate {
  label: string
  language: 'javascript'
  title: string
  content: string
}

export const COMPONENT_TEMPLATE: WebTemplate = {
  label: 'Component starter',
  language: 'web',
  title: 'My component',
  content: {
    html: '<button id="btn">Click me</button>\n<p id="output">0 clicks</p>',
    css: 'body {\n  font-family: sans-serif;\n  padding: 2rem;\n}\n\nbutton {\n  padding: 0.5rem 1rem;\n  cursor: pointer;\n}',
    js: 'let count = 0\nconst btn = document.getElementById("btn")\nconst output = document.getElementById("output")\n\nbtn.addEventListener("click", () => {\n  count++\n  output.textContent = `${count} click${count === 1 ? "" : "s"}`\n})',
  },
}

// Named "Script starter," not "API starter" — the playground runs a
// script to completion and captures its output (same Judge0 sandbox as
// the lesson runner), it doesn't host a persistent listening server. The
// PRD's "API starter" language would overpromise what this actually does.
export const SCRIPT_TEMPLATE: CodeTemplate = {
  label: 'Script starter',
  language: 'javascript',
  title: 'My script',
  content: `// A Node.js script — runs to completion, output shows up below.
// (This is a script sandbox, not a persistent API server.)

function processOrders(orders) {
  return orders
    .filter((o) => o.status === 'paid')
    .map((o) => ({ id: o.id, total: Math.round(o.total * 1.08 * 100) / 100 })) // add 8% tax
}

const sample = [
  { id: 1, status: 'paid', total: 20 },
  { id: 2, status: 'pending', total: 15 },
  { id: 3, status: 'paid', total: 42.5 },
]

console.log(JSON.stringify(processOrders(sample), null, 2))
`,
}
