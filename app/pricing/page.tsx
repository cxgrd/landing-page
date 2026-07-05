import { Metadata } from 'next'
import PricingClient from './pricing-client'

export const metadata: Metadata = {
  title: 'Pricing | CXGRD — Free, Pro, and Team Plans',
  description: 'Compare CXGRD plans for blast radius analysis, AI prompt enrichment, and PR merge policy enforcement.',
}

export default function PricingPage() {
  return <PricingClient />
}