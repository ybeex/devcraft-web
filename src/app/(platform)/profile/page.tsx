'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { GOALS, type Goal } from '@/components/onboarding/GoalsStep'
import { updateProfile } from '@/lib/api/users'
import { ApiRequestError } from '@/lib/api/client'
import { AVATAR_PRESETS } from '@/lib/avatars'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const MAX_GOALS = 4
const MAX_BIO = 500
const TRACK_OPTIONS = ['Frontend', 'Backend']

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function Avatar({ src, name, size }: { src: string | null | undefined; name: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-muted font-bold text-brand"
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name || '?')
      )}
    </span>
  )
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hasHydrated)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [track, setTrack] = useState<'FE' | 'BE' | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fill the form once from the saved profile; later store updates (e.g. our own save) must not overwrite typing.
  useEffect(() => {
    if (!user || loaded) return
    setDisplayName(user.displayName)
    setBio(user.bio ?? '')
    setAvatar(user.avatar ?? null)
    setGoals((user.goals ?? []) as Goal[])
    setTrack(user.primaryTrack ?? null)
    setLoaded(true)
  }, [user, loaded])

  if (!hydrated || !user) return <div className="mx-auto h-64 max-w-2xl animate-pulse px-5 py-8" />

  function toggleGoal(g: Goal) {
    setSaved(false)
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length >= MAX_GOALS ? prev : [...prev, g]))
  }

  function applyUrl() {
    const v = urlDraft.trim()
    if (!v) return
    if (!/^https:\/\/\S+$/i.test(v)) {
      setError('Use an image link that starts with https://')
      return
    }
    setError(null)
    setSaved(false)
    setAvatar(v)
    setUrlDraft('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (displayName.trim().length < 2) {
      setError('Your name needs at least 2 characters.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      updateUser(
        await updateProfile({
          displayName: displayName.trim(),
          bio: bio.trim(),
          avatar,
          goals,
          ...(track && { primaryTrack: track }),
        }),
      )
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-4">
        <Avatar src={avatar} name={displayName || user.displayName} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl font-bold text-ink">{displayName || user.displayName}</h1>
          <p className="text-sm text-dim">@{user.username}</p>
        </div>
        <Link
          href={`/p/${user.username}`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim hover:text-ink"
        >
          <ExternalLink size={13} /> Public page
        </Link>
      </div>

      <form onSubmit={handleSave} className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="text-sm font-semibold text-ink">Avatar</h2>
          <div className="mt-3 grid grid-cols-6 gap-2.5 sm:grid-cols-8">
            {AVATAR_PRESETS.map((src, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Avatar ${i + 1}`}
                aria-pressed={avatar === src}
                onClick={() => { setAvatar(src); setSaved(false) }}
                className={cn('rounded-full ring-offset-2 ring-offset-canvas transition', avatar === src ? 'ring-2 ring-brand' : 'hover:ring-2 hover:ring-rim')}
              >
                <Avatar src={src} name="" size={44} />
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyUrl() } }}
              placeholder="…or paste an https:// image link"
              aria-label="Avatar image link"
              className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-rim bg-card px-3.5 py-2 text-sm text-ink outline-none placeholder:text-ghost focus:border-brand"
            />
            <Button type="button" variant="outline" size="sm" onClick={applyUrl}>Use link</Button>
            {avatar && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAvatar(null); setSaved(false) }}>
                <Trash2 size={13} /> Remove
              </Button>
            )}
          </div>
        </section>

        <section>
          <label htmlFor="displayName" className="text-sm font-semibold text-ink">Display name</label>
          <input
            id="displayName"
            value={displayName}
            maxLength={100}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
            className="mt-2 w-full rounded-[var(--radius-md)] border border-rim bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
          />
        </section>

        <section>
          <label htmlFor="bio" className="text-sm font-semibold text-ink">Bio</label>
          <textarea
            id="bio"
            value={bio}
            maxLength={MAX_BIO}
            rows={4}
            onChange={(e) => { setBio(e.target.value); setSaved(false) }}
            placeholder="A line or two about what you are building or learning."
            className="mt-2 w-full resize-y rounded-[var(--radius-md)] border border-rim bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ghost focus:border-brand"
          />
          <p className="mt-1 text-right text-xs text-ghost">{bio.length}/{MAX_BIO}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Your track</h2>
          <div className="mt-2">
            <SegmentedControl
              options={TRACK_OPTIONS}
              value={track === 'BE' ? 'Backend' : track === 'FE' ? 'Frontend' : ''}
              onChange={(v) => { setTrack(v === 'Backend' ? 'BE' : 'FE'); setSaved(false) }}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Goals</h2>
          <p className="mt-1 text-xs text-dim">Pick up to {MAX_GOALS}. They decide which lessons are suggested first.</p>
          <div role="group" aria-label="Your goals" className="mt-3 flex flex-wrap gap-2.5">
            {GOALS.map(({ id, label, icon: Icon }) => {
              const on = goals.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleGoal(id)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                    on ? 'border-brand bg-brand-muted text-ink' : 'border-rim bg-card text-dim hover:text-ink',
                  )}
                >
                  {on ? <Check size={15} aria-hidden /> : <Icon size={15} aria-hidden />}
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {error && <p role="alert" className="text-sm font-medium text-error">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          {saved && <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-dim"><Check size={14} /> Saved</span>}
        </div>
      </form>
    </div>
  )
}
