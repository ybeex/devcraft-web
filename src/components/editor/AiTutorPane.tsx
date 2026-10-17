'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { getAiCredits, getHint, explainError, reviewCode, getAiHistory } from '@/lib/api/ai'
import { ApiRequestError } from '@/lib/api/client'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'
import { markdownComponents } from '@/lib/markdown/components'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const INTRO_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! Ask me anything about this lesson — I'll guide you, not just hand you the answer.",
}

interface AiTutorPaneProps {
  lessonId: string
  language: string
  currentCode: string
  pendingError: string | null
  onErrorHandled: () => void
}

export function AiTutorPane({ lessonId, language, currentCode, pendingError, onErrorHandled }: AiTutorPaneProps) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: credits } = useQuery({ queryKey: ['ai-credits'], queryFn: getAiCredits })

  // True server-side history now (previously client-state-only, reset on
  // every refresh). Hydrates once per lessonId — a background refetch of
  // this query (e.g. on window focus) must never stomp messages the user
  // has already sent locally in this session, so re-hydration only happens
  // when lessonId itself changes, not on every query resolution.
  const { data: history } = useQuery({
    queryKey: ['ai-history', lessonId],
    queryFn: () => getAiHistory(lessonId),
  })
  const hydratedForLessonRef = useRef<string | null>(null)

  useEffect(() => {
    if (history === undefined) return
    if (hydratedForLessonRef.current === lessonId) return
    hydratedForLessonRef.current = lessonId
    setMessages(history.length > 0 ? history.map((m) => ({ role: m.role, content: m.content })) : [INTRO_MESSAGE])
  }, [history, lessonId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function pushMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg])
  }

  async function runAiCall(userLabel: string, call: () => Promise<{ hint?: string; explanation?: string; review?: string }>) {
    pushMessage({ role: 'user', content: userLabel })
    setIsSending(true)
    try {
      const result = await call()
      const text = result.hint ?? result.explanation ?? result.review ?? ''
      pushMessage({ role: 'assistant', content: text })
      queryClient.invalidateQueries({ queryKey: ['ai-credits'] })
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.code === 'TOO_MANY_REQUESTS'
            ? err.message
            : err.code === 'BAD_REQUEST'
              ? "That question couldn't be processed — try rephrasing it."
              : err.message
          : 'Something went wrong reaching the AI tutor. Try again in a moment.'
      pushMessage({ role: 'system', content: message })
    } finally {
      setIsSending(false)
    }
  }

  function handleAsk() {
    const question = input.trim()
    if (!question || isSending) return
    setInput('')
    void runAiCall(question, () => getHint(lessonId, currentCode, question))
  }

  function handleExplainError() {
    if (!pendingError) return
    void runAiCall('Explain this error', () => explainError(lessonId, pendingError, currentCode, language)).then(onErrorHandled)
  }

  function handleReviewCode() {
    void runAiCall('Review my code', () => reviewCode(lessonId, currentCode))
  }

  const outOfCredits = credits && !credits.unlimited && credits.used >= credits.limit

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-rim-subtle bg-card py-3 pl-4 pr-12">
        <div className="flex items-center gap-2">
          <FeatureIcon name="aiTutor" size={26} />
          <span className="font-ui text-sm font-semibold text-ink">AI Tutor</span>
        </div>
        {credits && (
          <span className="text-xs text-ghost">
            {credits.unlimited ? 'Unlimited' : `${credits.limit - credits.used} of ${credits.limit} hints left today`}
          </span>
        )}
      </div>

      {pendingError && (
        <button
          onClick={handleExplainError}
          disabled={isSending}
          className="flex items-center gap-2 border-b border-rim-subtle bg-[var(--negative-bg)] px-4 py-2.5 text-left text-xs font-medium text-[var(--negative-text)] hover:opacity-90"
        >
          <AlertTriangle size={14} className="shrink-0" /> Your last run had an error — tap to have it explained
        </button>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {history === undefined && messages.length === 0 && (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-ghost">
            <Loader2 size={13} className="animate-spin" /> Loading conversation...
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className={cn('mb-3 flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role !== 'assistant' && 'whitespace-pre-wrap',
                  msg.role === 'user' && 'rounded-tr-sm bg-brand text-white',
                  msg.role === 'assistant' && 'rounded-tl-sm bg-card text-ink',
                  msg.role === 'system' && 'w-full rounded-lg bg-[var(--negative-bg)] text-center text-xs text-[var(--negative-text)]'
                )}
              >
                {msg.role === 'assistant' ? (
                  <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                  </Markdown>
                ) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-ghost">
            <Loader2 size={13} className="animate-spin" /> Thinking...
          </div>
        )}
      </div>

      <div className="border-t border-rim-subtle bg-card p-3">
        <button
          onClick={handleReviewCode}
          disabled={isSending || outOfCredits}
          className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-rim py-2 text-xs font-semibold text-dim hover:bg-raised disabled:opacity-50"
        >
          <Sparkles size={13} /> Review my code
        </button>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            disabled={isSending || !!outOfCredits}
            placeholder={outOfCredits ? 'Daily AI limit reached' : 'Ask a question...'}
            className="w-full flex-1 rounded-full border border-rim bg-canvas px-4 py-2 text-sm text-ink outline-none placeholder:text-ghost focus:border-brand disabled:opacity-50"
          />
          <button
            onClick={handleAsk}
            disabled={isSending || !input.trim() || !!outOfCredits}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
