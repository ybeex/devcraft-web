import { Hero } from '@/components/marketing/Hero'
import { StatsBar } from '@/components/marketing/StatsBar'
import { TechStackMarquee } from '@/components/marketing/TechStackMarquee'
import { TracksSection } from '@/components/marketing/TracksSection'
import { FeatureBento } from '@/components/marketing/FeatureBento'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Testimonials } from '@/components/marketing/Testimonials'
import { PricingPreview } from '@/components/marketing/PricingPreview'
import { FinalCta } from '@/components/marketing/FinalCta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TechStackMarquee />
      <TracksSection />
      <FeatureBento />
      <HowItWorks />
      <Testimonials />
      <PricingPreview />
      <FinalCta />
    </>
  )
}
