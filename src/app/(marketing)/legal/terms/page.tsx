import type { Metadata } from 'next'
import { LegalPageTemplate, type LegalSection } from '@/components/marketing/LegalPageTemplate'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of DevCraft.',
}

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    heading: '1. Acceptance of terms',
    body: (
      <>
        <p>
          By creating a DevCraft account or otherwise accessing the platform, you agree to these
          Terms of Service. If you are using DevCraft on behalf of an organization (a Team
          workspace), you are agreeing on that organization&apos;s behalf and confirming you have
          the authority to do so.
        </p>
        <p>
          If you do not agree to these terms, do not create an account or use the platform.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    heading: '2. Accounts',
    body: (
      <>
        <p>
          You must provide accurate registration information and keep your password secure. You
          are responsible for all activity that happens under your account. Tell us immediately at{' '}
          <a href="mailto:security@devcraft.io">security@devcraft.io</a> if you suspect
          unauthorized access.
        </p>
        <p>
          You must be at least 13 years old to create an account. If you are between 13 and the
          age of majority in your jurisdiction, you confirm a parent or guardian has reviewed and
          agreed to these terms on your behalf.
        </p>
      </>
    ),
  },
  {
    id: 'subscriptions',
    heading: '3. Subscriptions and billing',
    body: (
      <>
        <p>
          The core Frontend and Backend curricula are free. Pro and Team tiers are billed monthly
          or annually as selected at checkout, in advance, and auto-renew until cancelled.
          Cancelling stops future renewals but does not refund the current billing period unless
          required by law in your jurisdiction.
        </p>
        <p>
          We may change subscription pricing with at least 30 days&apos; notice to active
          subscribers. Continued use after a price change takes effect constitutes acceptance of
          the new price.
        </p>
      </>
    ),
  },
  {
    id: 'ai-features',
    heading: '4. AI-powered features',
    body: (
      <>
        <p>
          DevCraft&apos;s hint, code-review, error-explanation, and mock-interview features are
          powered by third-party large language models accessed through OpenRouter. When you use
          these features, the code, questions, and answers you submit are sent to the selected
          model provider to generate a response. Do not submit confidential, proprietary, or
          personally identifying information about third parties into these features.
        </p>
        <p>
          AI-generated hints, reviews, and feedback are provided for educational purposes and may
          contain errors. They do not constitute professional advice and should not be your sole
          basis for a technical or career decision.
        </p>
        <p>
          Free-tier accounts receive a limited number of AI credits per day, reset at midnight
          UTC. Pro and Team accounts receive unlimited use subject to our fair-use policy —
          automated or bulk querying of AI endpoints outside normal learning use is prohibited and
          may result in throttling or suspension.
        </p>
      </>
    ),
  },
  {
    id: 'user-content',
    heading: '5. Your content',
    body: (
      <>
        <p>
          You retain ownership of code, project submissions, community posts, and any other
          content you create on DevCraft (&quot;User Content&quot;). By posting User Content, you
          grant DevCraft a worldwide, non-exclusive, royalty-free license to host, display,
          reproduce, and distribute it as necessary to operate the platform — for example,
          displaying your project submission on your public portfolio page, or your community post
          in search results.
        </p>
        <p>
          <strong className="text-ink">Public by default.</strong> Your portfolio page, completed
          project showcases, and community posts are publicly visible unless you change your
          portfolio&apos;s visibility setting to private. Earned certificates are always publicly
          verifiable at their certificate URL, since their purpose is third-party (e.g. employer)
          verification.
        </p>
        <p>
          You are solely responsible for User Content you submit. Do not post content that
          infringes someone else&apos;s intellectual property, contains malware, or violates
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    heading: '6. Acceptable use',
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Do not attempt to bypass the code-execution sandbox&apos;s resource or network limits.</li>
        <li>Do not use automated tools to scrape, farm XP, or manipulate the leaderboard.</li>
        <li>Do not attempt prompt injection or jailbreak techniques against AI-tutor features.</li>
        <li>Do not harass, impersonate, or share private information about other learners in the community.</li>
        <li>Do not resell, sublicense, or provide platform access to non-account-holders.</li>
      </ul>
    ),
  },
  {
    id: 'termination',
    heading: '7. Suspension and termination',
    body: (
      <p>
        We may suspend or terminate accounts that violate these terms, including via automated
        detection of abusive AI usage, sandbox abuse, or community moderation violations.
        Terminated Team accounts may have their workspace data exported by an admin for 30 days
        following termination, after which it is permanently deleted.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    heading: '8. Disclaimers and limitation of liability',
    body: (
      <>
        <p>
          DevCraft is provided &quot;as is&quot; without warranties of any kind. We do not
          guarantee that completing a track will result in employment, nor that AI-generated
          feedback is error-free.
        </p>
        <p>
          To the maximum extent permitted by law, DevCraft&apos;s total liability for any claim
          arising from your use of the platform is limited to the amount you paid us in the 12
          months preceding the claim.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    heading: '9. Changes to these terms',
    body: (
      <p>
        We may update these terms from time to time. Material changes will be announced on the{' '}
        <a href="/changelog">changelog</a> and, for active subscribers, via email at least 14 days
        before taking effect.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: '10. Contact',
    body: (
      <p>
        Questions about these terms can be sent to{' '}
        <a href="mailto:legal@devcraft.io">legal@devcraft.io</a> or through our{' '}
        <a href="/contact">contact page</a>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return <LegalPageTemplate title="Terms of Service" lastUpdated="June 1, 2026" sections={sections} />
}
