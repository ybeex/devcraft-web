import { NotFoundIllustration } from '@/components/marketing/NotFoundIllustration'

/**
 * The true last-resort fallback — Next.js renders this for any path it
 * cannot match into ANY segment tree at all, bypassing every route group's
 * own layout and not-found.tsx (see the catch-all trigger files in
 * (marketing) and (platform) for the two contextual variants that DO get
 * their real layout chrome). This root version has no guaranteed
 * header/footer or sidebar available, so it renders the same illustration
 * standalone rather than attempting to fake either chrome.
 */
export default function RootNotFound() {
  return <NotFoundIllustration />
}
