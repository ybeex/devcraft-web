import type { Metadata } from 'next'
import { LegalPageTemplate, type LegalSection } from '@/components/marketing/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How DevCraft collects, uses, and protects your data.',
}

const sections: LegalSection[] = [
  {
    id: 'overview',
    heading: '1. Overview',
    body: (
      <p>
        This policy explains what data DevCraft collects, why, and the choices you have. We
        collect the minimum needed to run the platform, teach effectively, and keep accounts
        secure — we do not sell personal data.
      </p>
    ),
  },
  {
    id: 'data-we-collect',
    heading: '2. Data we collect',
    body: (
      <>
        <p>
          <strong className="text-ink">Account data:</strong> email, username, display name,
          hashed password (we never store your plaintext password — see Security below), and
          optional profile fields like bio and avatar.
        </p>
        <p>
          <strong className="text-ink">Learning activity:</strong> lesson progress, XP, streaks,
          project submissions, code you write in lessons and the playground, quiz answers, and
          interview-prep responses.
        </p>
        <p>
          <strong className="text-ink">AI feature inputs:</strong> the code, questions, and
          answers you submit to hint, review, explanation, or mock-interview features, which are
          transmitted to our AI infrastructure provider (OpenRouter) and the underlying model to
          generate a response. See{' '}
          <a href="/legal/terms#ai-features">AI-powered features</a> in our Terms.
        </p>
        <p>
          <strong className="text-ink">Community content:</strong> posts, comments, and reactions
          you create, which are public by design.
        </p>
        <p>
          <strong className="text-ink">Payment data:</strong> for Pro and Team subscriptions,
          payment is processed by our payment provider directly — DevCraft does not store your
          full card number.
        </p>
        <p>
          <strong className="text-ink">Technical data:</strong> IP address (used for rate
          limiting and abuse prevention, retained briefly), device/browser type, and basic usage
          analytics.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    heading: '3. How we use your data',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Operate core features: track progress, award XP, run code in the sandbox, issue certificates.</li>
        <li>Personalize the AI tutor&apos;s hints and recommendations to your track and history.</li>
        <li>Detect and prevent abuse — account lockouts after failed logins, rate limiting, sandbox resource limits.</li>
        <li>Send transactional email (verification, password reset, receipts) and, if you opt in, product updates.</li>
        <li>Improve the curriculum by analyzing aggregate, de-identified completion and drop-off patterns.</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    heading: '4. When we share data',
    body: (
      <>
        <p>We share data only in these circumstances:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-ink">AI providers:</strong> content you submit to AI features
            is sent to OpenRouter and the model provider it routes to, solely to generate your
            response.
          </li>
          <li>
            <strong className="text-ink">Service providers:</strong> hosting, email delivery, and
            payment processing vendors, bound by contract to use your data only to provide their
            service to us.
          </li>
          <li>
            <strong className="text-ink">Public by your choice:</strong> your portfolio (unless
            set to private), community posts, and issued certificates are visible to anyone with
            the link — that visibility is the point of those features.
          </li>
          <li>
            <strong className="text-ink">Legal requirements:</strong> if required by valid legal
            process, or to protect the safety of our users or the public.
          </li>
        </ul>
        <p>We do not sell your personal data to third parties or data brokers.</p>
      </>
    ),
  },
  {
    id: 'security',
    heading: '5. Security',
    body: (
      <p>
        Passwords are hashed with bcrypt and never stored in plaintext. Refresh tokens are stored
        as SHA-256 hashes. All traffic is encrypted in transit via TLS. Access to production data
        is limited to engineers who need it, and administrative actions are logged in an audit
        trail. No system is perfectly secure — if we discover a breach affecting your data, we
        will notify you as required by applicable law.
      </p>
    ),
  },
  {
    id: 'retention',
    heading: '6. Data retention',
    body: (
      <p>
        We retain account and learning-activity data for as long as your account is active. If
        you delete your account, we deactivate and anonymize your login credentials immediately;
        learning activity tied to an anonymized account ID may be retained in aggregate,
        de-identified form for curriculum analytics. Backups are retained for up to 30 days before
        rolling deletion.
      </p>
    ),
  },
  {
    id: 'your-rights',
    heading: '7. Your rights and choices',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Access a copy of the personal data we hold about you.</li>
          <li>Correct inaccurate data via your account settings.</li>
          <li>Delete your account and associated personal data.</li>
          <li>Set your portfolio to private, opting out of public visibility.</li>
          <li>Opt out of non-essential product emails at any time via the unsubscribe link.</li>
        </ul>
        <p>
          To exercise any of these rights, contact <a href="mailto:privacy@devcraft.io">privacy@devcraft.io</a>{' '}
          or use the account-deletion option in Settings.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    heading: '8. Cookies',
    body: (
      <p>
        We use essential cookies to keep you signed in and remember your theme preference
        (light/dark). We use a small number of analytics cookies to understand aggregate feature
        usage; these do not track you across other websites.
      </p>
    ),
  },
  {
    id: 'children',
    heading: "9. Children's privacy",
    body: (
      <p>
        DevCraft is not directed at children under 13, and we do not knowingly collect personal
        data from children under 13. If you believe a child has created an account, contact us at{' '}
        <a href="mailto:privacy@devcraft.io">privacy@devcraft.io</a> and we will take appropriate
        action.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: '10. Changes to this policy',
    body: (
      <p>
        We will post material changes to this policy on our <a href="/changelog">changelog</a>{' '}
        and, where required, notify active users by email before the changes take effect.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: '11. Contact',
    body: (
      <p>
        Privacy questions can be sent to <a href="mailto:privacy@devcraft.io">privacy@devcraft.io</a>{' '}
        or through our <a href="/contact">contact page</a>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return <LegalPageTemplate title="Privacy Policy" lastUpdated="June 1, 2026" sections={sections} />
}
