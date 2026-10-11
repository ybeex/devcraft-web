import { Hero } from '@/components/marketing/Hero'
import { StatsBar } from '@/components/marketing/StatsBar'
import { TracksSection } from '@/components/marketing/TracksSection'
import { FeatureBento } from '@/components/marketing/FeatureBento'
import { Testimonials } from '@/components/marketing/Testimonials'
import { PricingPreview } from '@/components/marketing/PricingPreview'
import { FinalCta } from '@/components/marketing/FinalCta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TracksSection />
      <FeatureBento />
      <Testimonials />
      <PricingPreview />
      <FinalCta />
    </>
  )
}
