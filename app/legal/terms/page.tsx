import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — cxgrd',
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

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.75', marginBottom: '0.25rem' }}>
    {children}
  </li>
);

const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>
    {children}
  </ul>
);

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: '#60a5fa', textDecoration: 'none' }}>{children}</a>
);

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <P>
            By accessing or using CXGRD, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions. If you do not agree, please do not use the platform.
          </P>
        </div>

        <Section id="eligibility" title="1. Eligibility">
          <P>
            You must be at least 18 years of age to use CXGRD. By using the platform, you represent that you meet this requirement.
          </P>
        </Section>

        <Section id="accounts" title="2. Accounts">
          <P>
            User authentication is provided exclusively via GitHub OAuth. You assume sole responsibility for maintaining the security, credentials, and access permissions of your GitHub account. Any activity under your account is your responsibility.
          </P>
        </Section>

        <Section id="subscriptions" title="3. Subscriptions">
          <P>
            CXGRD offers paid monthly subscription access. Paid accounts automatically renew at the end of each billing cycle unless explicitly canceled before the renewal date. You may cancel at any time from your account settings.
          </P>
          <P>
            Refund eligibility is assessed on a case-by-case basis. See our <Link href="/legal/refund">Refund Policy</Link> for details.
          </P>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable use">
          <P>By using CXGRD, you agree not to:</P>
          <Ul>
            <Li>Abuse, degrade, or disrupt the operation, scale, or integrity of the service</Li>
            <Li>Attempt unauthorized access to our networks, servers, or user databases</Li>
            <Li>Use CXGRD to execute, support, or promote unlawful activities</Li>
            <Li>Reverse engineer, decompile, clone, or maliciously exploit the technical architecture of the platform</Li>
            <Li>Resell, sublicense, or redistribute access to the platform without written permission</Li>
          </Ul>
          <P>
            Violation of these terms may result in immediate suspension or termination of your account without prior notice.
          </P>
        </Section>

        <Section id="availability" title="5. Availability & service guarantees">
          <P>
            While we strive to maximize uptime and responsiveness, CXGRD is provided without an explicit Service Level Agreement (SLA). We do not guarantee uninterrupted or error-free operations.
          </P>
        </Section>

        <Section id="third-party" title="6. Third-party dependencies">
          <P>
            Core elements of CXGRD depend on external providers including GitHub, Supabase, Dodo Payments, Groq, PostHog, Vercel, and UptimeRobot. We are not liable for outages, upstream downtime, data delivery failures, or errors caused directly by these third-party services.
          </P>
        </Section>

        <Section id="liability" title="7. Limitation of liability">
          <P>
            CXGRD is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, punitive, or consequential damages — including but not limited to loss of profits, data corruption, or business interruption — arising from the use or inability to use the platform.
          </P>
          <P>
            Our total liability to you for any claim arising from use of CXGRD shall not exceed the amount you paid us in the three months preceding the claim.
          </P>
        </Section>

        <Section id="termination" title="8. Termination">
          <P>
            We reserve the right to suspend, restrict, or terminate your access to CXGRD, with or without prior notice, for suspected violations of these Terms or for any conduct we reasonably determine to be harmful to the platform or other users. Where possible, we will notify you via email before taking such action.
          </P>
        </Section>

        <Section id="governing-law" title="9. Governing law & jurisdiction">
          <P>
            These Terms and Conditions are governed by the laws of India. Any disputes arising from or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in India. Users in the EU or UK may also have rights under applicable local consumer protection law.
          </P>
        </Section>

        <Section id="changes" title="10. Changes to these terms">
          <P>
            We may update these Terms periodically. Material changes will be communicated via email or a notice on the platform. Your continued use of CXGRD after changes are posted constitutes your agreement to the revised Terms.
          </P>
        </Section>

        <Section id="contact" title="11. Contact">
          <P>
            Questions regarding these Terms may be directed to{' '}
            <Link href="mailto:hello@cxgrd.com">hello@cxgrd.com</Link>.
          </P>
        </Section>

      </div>
    </div>
  );
}
