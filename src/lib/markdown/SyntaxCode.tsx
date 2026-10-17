const KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'def', 'elif', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from',
  'function', 'if', 'import', 'in', 'interface', 'let', 'new', 'null', 'of',
  'pass', 'print', 'private', 'public', 'raise', 'return', 'static', 'this',
  'throw', 'True', 'true', 'try', 'var', 'while', 'with', 'yield', 'None',
])

/** Small dependency-free tokenizer for readable highlighting in lesson/chat code samples. */
export function SyntaxCode({ code, language = '' }: { code: string; language?: string }) {
  const hasHashComments = /^(py|python|shell|bash|sh|ruby|rb|yaml|yml)/i.test(language)
  const patterns = [
    String.raw`\/\*[\s\S]*?\*\/`,
    String.raw`\/\/[^\n]*`,
    ...(hasHashComments ? [String.raw`#[^\n]*`] : []),
    String.raw`"(?:\\.|[^"\\])*"`,
    String.raw`'(?:\\.|[^'\\])*'`,
    String.raw`\x60(?:\\.|[^\x60\\])*\x60`,
    String.raw`<\/?[A-Za-z][\w:-]*`,
    String.raw`[A-Za-z_:][\w:.-]*(?=\s*=)`,
    String.raw`\b\d+(?:\.\d+)?\b`,
    String.raw`\b[A-Za-z_$][\w$]*\b`,
    String.raw`===?|!==?|=>|[+*/%=<>!&|?:~-]`,
  ]
  const tokenPattern = new RegExp(`(${patterns.join('|')})`, 'g')
  const tokens = code.split(tokenPattern).filter(Boolean)
  return (
    <code className="font-mono text-[13px] leading-relaxed text-ink">
      {tokens.map((token, index) => {
        let kind = ''
        if (/^(\/\/|\/\*)/.test(token) || (hasHashComments && token.startsWith('#'))) kind = 'comment'
        else if (/^<\/?[A-Za-z]/.test(token)) kind = 'tag'
        else if (/^[A-Za-z_:][\w:.-]*$/.test(token) && tokens.slice(index + 1).find((next) => next.trim())?.startsWith('=')) kind = 'attribute'
        else if (/^["'`]/.test(token)) kind = 'string'
        else if (/^\d/.test(token)) kind = 'number'
        else if (KEYWORDS.has(token)) kind = 'keyword'
        else if (
          /^[A-Za-z_$][\w$]*$/.test(token) &&
          tokens.slice(index + 1).find((next) => next.trim())?.startsWith('(')
        ) kind = 'function'
        else if (/^(===?|!==?|=>|[+*/%=<>!&|?:~-])$/.test(token)) kind = 'operator'
        return kind ? <span key={index} className={`syntax-${kind}`}>{token}</span> : token
      })}
    </code>
  )
}
