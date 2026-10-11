import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DevCraftMark } from '@/components/brand/DevCraftMark'

export function FinalCta() {
  return (
    <section className="mesh-bg px-6 py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <DevCraftMark size={56} animate="wobble" />
        <h2 className="mt-6 font-display text-3xl font-bold text-ink sm:text-4xl">
          Stop reading about it. Start building it.
        </h2>
        <p className="mt-3 text-dim">Free forever on the fundamentals. No credit card.</p>
        <Link href="/register" className="mt-8">
          <Button size="lg">
            Start learning <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </section>
  )
}
