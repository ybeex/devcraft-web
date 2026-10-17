'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Trash2 } from 'lucide-react'
import {
  getAdminUserDetail,
  updateAdminUser,
  deleteAdminUser,
  grantAdminXp,
  type UserRole,
  type UserTier,
} from '@/lib/api/admin'
import { TextField, NumberField, SelectField, ToggleField } from '@/components/admin/content/FormFields'
import { useContentSave } from '@/components/admin/content/useContentSave'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { Button } from '@/components/ui/Button'
import { adminGrantPro } from '@/lib/api/pro'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'USER', label: 'User' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' },
]

const TIER_OPTIONS: { value: UserTier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'PRO', label: 'Pro' },
  { value: 'TEAM', label: 'Team' },
]

const SUBMISSION_STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-warning/15 text-warning',
  APPROVED: 'bg-success/15 text-success',
  NEEDS_REVISION: 'bg-error/15 text-error',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user-detail', id],
    queryFn: () => getAdminUserDetail(id),
  })

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!user) return
    if (
      !window.confirm(
        `Deactivate ${user.displayName}'s account? This sets them inactive and appends ".deleted" to their email so they can't log back in with it. This can't be undone.`
      )
    ) {
      return
    }
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteAdminUser(id)
      router.push('/admin/users')
    } catch {
      setDeleteError("Couldn't deactivate this account — try again.")
      setIsDeleting(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-8 sm:px-8">
        <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <Link href="/admin/users" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-dim hover:text-ink">
          <ArrowLeft size={13} /> Back to users
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarStack avatars={[{ name: user.displayName, src: user.avatar }]} max={1} size={44} />
            <div>
              <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{user.displayName}</h1>
              <p className="text-sm text-dim">{user.email}</p>
            </div>
          </div>
          {user.role !== 'ADMIN' && (
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={14} /> {isDeleting ? 'Deactivating…' : 'Deactivate'}
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div variants={cascadeItem} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Level', value: user.level },
          { label: 'XP', value: user.xp.toLocaleString() },
          { label: 'Streak', value: `${user.currentStreak}d` },
          { label: 'Lessons done', value: user.lessonsCompleted },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-3 text-center shadow-elev-sm">
            <p className="text-lg font-bold text-ink">{stat.value}</p>
            <p className="text-xs text-dim">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {deleteError && <p className="text-sm font-medium text-error">{deleteError}</p>}

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Profile & access</h2>
        <UserEditForm user={user} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] })} />
      </motion.div>

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Award size={18} /> Grant XP
        </h2>
        <GrantXpForm userId={id} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] })} />
      </motion.div>

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Award size={18} /> Grant Pro
        </h2>
        <GrantProForm userId={id} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] })} />
      </motion.div>

      {user.portfolio && (
        <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6">
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Portfolio</h2>
          <p className="text-sm text-ink">{user.portfolio.headline || <span className="italic text-ghost">No headline set</span>}</p>
          <p className="mt-1 text-xs text-dim">{user.portfolio.isPublic ? 'Public' : 'Private'}</p>
        </motion.div>
      )}

      <motion.div variants={cascadeItem} className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
          <h2 className="mb-3 font-display text-base font-bold text-ink">Recent submissions</h2>
          {user.projectSubmissions.length === 0 ? (
            <p className="text-sm text-dim">None yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.projectSubmissions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs text-dim">{s.id.slice(0, 8)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', SUBMISSION_STATUS_TONE[s.status])}>{s.status}</span>
                  <span className="text-xs text-dim">{s.aiScore !== null ? `${s.aiScore}/10` : '—'}</span>
                  <span className="text-xs text-ghost">{formatDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
          <h2 className="mb-3 font-display text-base font-bold text-ink">Recent XP events</h2>
          {user.xpEvents.length === 0 ? (
            <p className="text-sm text-dim">None yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.xpEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-xs text-ink">{e.description || e.eventType}</span>
                  <span className="shrink-0 text-xs font-semibold text-success">+{e.xpAwarded}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function UserEditForm({ user, onSaved }: { user: Awaited<ReturnType<typeof getAdminUserDetail>>; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [role, setRole] = useState<UserRole>(user.role)
  const [tier, setTier] = useState<UserTier>(user.tier)
  const [isActive, setIsActive] = useState(user.isActive)
  const [emailVerified, setEmailVerified] = useState(user.emailVerified)
  const [xp, setXp] = useState(user.xp)
  const { isSaving, error, save } = useContentSave()

  return (
    <div className="flex flex-col gap-4">
      <TextField label="Display name" value={displayName} onChange={setDisplayName} />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
        <SelectField label="Tier" value={tier} onChange={setTier} options={TIER_OPTIONS} />
      </div>
      <NumberField label="XP (direct correction)" value={xp} onChange={setXp} min={0} hint="For fixing mistakes — use Grant XP below for normal awards, which keeps a reason on record" />
      <div className="grid grid-cols-2 gap-4">
        <ToggleField label="Active" checked={isActive} onChange={setIsActive} hint="Off logs them out everywhere" />
        <ToggleField label="Email verified" checked={emailVerified} onChange={setEmailVerified} />
      </div>

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={isSaving}
          onClick={() =>
            save(() => updateAdminUser(user.id, { displayName, role, tier, isActive, emailVerified, xp }), onSaved)
          }
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

function GrantProForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [days, setDays] = useState(30)
  const [note, setNote] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const { isSaving, error, save } = useContentSave()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-dim">Adds days on top of whatever Pro time is left. The learner is notified and the grant is recorded in the audit log.</p>
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <NumberField label="Days" value={days} onChange={setDays} min={1} max={366} />
        <TextField label="Note (optional)" value={note} onChange={setNote} placeholder="Support goodwill" />
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
      {done && <p role="status" className="text-xs font-medium text-success">{done}</p>}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={isSaving || days < 1}
          onClick={() => save(
            async () => { await adminGrantPro(userId, days, note.trim()) },
            () => { setDone(`Added ${days} days of Pro.`); setNote(''); onSaved() },
          )}
        >
          {isSaving ? 'Granting…' : 'Grant Pro'}
        </Button>
      </div>
    </div>
  )
}

function GrantXpForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [amount, setAmount] = useState(50)
  const [reason, setReason] = useState('')
  const { isSaving, error, save } = useContentSave()

  const canSave = amount >= 1 && reason.trim().length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <NumberField label="Amount" value={amount} onChange={setAmount} min={1} max={10_000} />
        <TextField label="Reason" value={reason} onChange={setReason} placeholder="Compensating for a platform bug" />
      </div>

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={isSaving || !canSave}
          onClick={() =>
            save(
              () => grantAdminXp(userId, amount, reason),
              () => {
                setReason('')
                onSaved()
              }
            )
          }
        >
          {isSaving ? 'Granting…' : 'Grant XP'}
        </Button>
      </div>
    </div>
  )
}
