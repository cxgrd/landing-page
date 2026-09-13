import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'CXGRD - Give your AI coding tools the architectural context they lack',
  description: 'Give architectural context to AI coding tools. CXGRD computes downstream blast radius before edits, checks generated diffs for structural and logic risks, and enforces org-wide guardrails.',
};

export default function HomePage() {
  return <HomeClient />;
}