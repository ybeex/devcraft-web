import { DevCraftMark } from '@/components/brand/DevCraftMark'

/**
 * Full-page loader, used at Suspense boundaries and initial app load only —
 * never for inline content (use Skeleton there instead). The gem mark spins
 * on its Y-axis, a literal 3D effect only a faceted mark (not a flat icon)
 * can pull off convincingly.
 */
export function BrandedLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <DevCraftMark size={56} animate="spin" />
    </div>
  )
}
