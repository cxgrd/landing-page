import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — CXGRD',
  description: 'Learn about the story behind CXGRD, the person who built it, and the philosophy that guides its development.',
};

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} style={{ marginBottom: '2.5rem' }}>
    <h2 style={{
      fontSize: '17px',
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
  <li style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.75', marginBottom: '0.25rem' }}>
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


export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#05070f', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#f4f7ff',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-geist-mono)',
            marginBottom: '0.75rem',
          }}>
            About CXGRD
          </h1>
        </div>

        <Section id="Sub-heading" title="Building the context layer for development.">
          <P>
            Let's be honest: stateless AI code assistants are incredibly powerful, but they have terrible short-term memory. They look at your code through a keyhole.
            I built CXGRD to give AI the full macro-perspective of your codebase so it stops breaking things.
          </P>
        </Section>

        <Section id="beginning" title="How it started">
          <P>
            A few months ago, I was working on a PR reviewer tool built specifically for solo devs and small teams (that tool failed, btw). Every single time I asked an AI assistant to fix one thing or implement a new feature, it would inadvertently break code somewhere else.
            It made me wonder: Why can't AI tools have a full map of the entire project directory? Dependencies in complex systems are highly intertwined, and stateless AI models desperately need that macro-context to know exactly which files to modify.
            I needed a way to give these models the precise context required for every new change. So, I opened my editor and built a CLI tool to do exactly that.

            That's how CXGRD was born.
          </P>
        </Section>

        <Section id="philosophy" title="My product rules">
          <P>
            Since I work on this product alone, I don't have to answer to a board of directors or chase artificial hyper-growth. That means I get to focus entirely on making the tool better for you. Here is what I promise:
          </P>
          <Ul>
            <Li><strong style={{ color: '#cbd5e1' }}>Zero Bloat</strong> I only build features that actually add value. No flashy distractions, just pure technical utility.</Li>
            <Li><strong style={{ color: '#cbd5e1' }}>Fair, Honest Pricing</strong> No hidden tiers or enterprise trapdoors. It's priced so independent developers and small teams can actually afford it.</Li>
            <Li><strong style={{ color: '#cbd5e1' }}>Direct Support</strong> When you send a bug report or a feature request, you're not talking to a bot or a support queue. You're talking directly to me—the person who wrote the code.</Li>
          </Ul>
        </Section>

        <Section id="meet-me" title="Meet the Person Behind the Code">
          <P>
            <strong style={{ color: '#cbd5e1' }}>Hey, I'm Manan</strong><br></br>
            I'm a self-taught programmer who loves to dive into the complex architecture of large systems and explore how things work under the hood. I get a massive kick out of "builder's dopamine"—there's nothing quite like the feeling of shipping a clean feature and seeing it solve a real-world problem.
            When I'm not actively pushing commits or optimizing infrastructure for CXGRD, you can usually find me reading heavy technical books, messing around with low-level systems, or thinking about my next side project.
          </P>
        </Section>

        <Section id="cta" title="Let's build together">
          <P>
            CXGRD is shaped entirely by the people who use it. If you have a feature request, found a bug, or just want to talk shop about code, my inbox is always open.
            You can follow my building journey on <Link href="https://x.com/MananSh92557906">X (Twitter)</Link> or check out the project over on <Link href="https://github.com/cxgrd">GitHub</Link>
          </P>
        </Section>

        <Link href="https://cxgrd.com/#install">Give CXGRD a spin</Link>
        
      </div>
    </div>
  )
}