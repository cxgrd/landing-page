import { Metadata } from 'next'
import FAQClient from './faq-client'

export const metadata: Metadata = {
  title: 'FAQ | CXGRD — Frequently Asked Questions',
  description: 'Find answers to common questions about CXGRD\'s blast radius analysis, AI prompt enrichment, and PR merge policy enforcement.',
}

export default function FAQPage() {
  return <FAQClient />
}