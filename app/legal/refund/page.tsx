import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — CXGRD',
  description: 'CXGRD Refund Policy — Learn about our refund and cancellation policy for subscriptions. Understand the eligibility criteria and how to request a refund.',
};

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} style={{ marginBottom: '2.5rem' }}>
    <h2 style={{
      fontSize: '15px',
      fontWeight: 600,
      color: '#f4f7ff',
      marginBottom: '0.75rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid rgba(148,163,184,0.1)',
      fontFamily: 'var(--font-geist-mono)',
      letterSpacing: '-0.01em',
    }}>{title}</h2>
    {children}
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.75', marginBottom: '0.75rem' }}>
    {children}
  </p>
);

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: '#60a5fa', textDecoration: 'none' }}>{children}</a>
);

export default function RefundPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#05070f', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '12px', color: '#475569', fontFamily: 'var(--font-geist-mono)', marginBottom: '0.5rem' }}>
            Last updated: June 22, 2026
          </p>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#f4f7ff',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-geist-mono)',
            marginBottom: '0.75rem',
          }}>
            Refund Policy
          </h1>
          <P>
            Thank you for subscribing to CXGRD. Please read our refund and cancellation policy carefully before subscribing.
          </P>
        </div>

        <Section id="billing" title="1. Billing & cancellation">
          <P>
            CXGRD operates on a monthly recurring subscription. You may cancel your active subscription at any time. Cancellation takes effect immediately — no further renewal invoices will be charged after cancellation is confirmed.
          </P>
          <P>
            Cancellation does not automatically trigger a refund for the remaining days of the current billing cycle. You will retain access to the platform until the end of the period you have already paid for.
          </P>
        </Section>

        <Section id="refunds" title="2. Refund eligibility">
          <P>
            Refunds are not guaranteed and are not automatically issued upon cancellation. Each request is reviewed individually based on the following factors:
          </P>
          <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>
            {[
              'Documented technical failures on our end that meaningfully prevented use of the platform',
              'Duplicate charges or billing errors',
              'Accidental renewal where cancellation was not possible due to a platform fault',
            ].map((item) => (
              <li key={item} style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.75', marginBottom: '0.25rem' }}>
                {item}
              </li>
            ))}
          </ul>
          <P>
            General dissatisfaction, change of mind, or underuse of the platform do not qualify as grounds for a refund. Approved refunds are granted at our sole discretion.
          </P>
        </Section>

        <Section id="how-to-request" title="3. How to request a refund">
          <P>
            To submit a refund or billing review request, email{' '}
            <Link href="mailto:hello@cxgrd.com">hello@cxgrd.com</Link> with the following:
          </P>
          <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>
            {[
              'Your account email address',
              'The date of the charge in question',
              'A brief description of the issue or reason for the request',
            ].map((item) => (
              <li key={item} style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.75', marginBottom: '0.25rem' }}>
                {item}
              </li>
            ))}
          </ul>
          <P>
            We aim to respond to all refund requests within 5 business days. Approved refunds are processed via the original payment method through Dodo Payments and may take 5–10 business days to appear.
          </P>
        </Section>

        <Section id="contact" title="4. Contact">
          <P>
            For any billing questions or concerns, reach us at{' '}
            <Link href="mailto:hello@cxgrd.com">hello@cxgrd.com</Link>.
          </P>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
