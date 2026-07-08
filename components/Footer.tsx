import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Architecture", href: "/#architecture" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "FAQs", href: "/faq" },
  ],
  Commands: [
    { label: "cxgrd scan", href: "/docs/commands/scan" },
    { label: "cxgrd input", href: "/docs/commands/input" },
    { label: "cxgrd prompt", href: "/docs/commands/prompt" },
    { label: "cxgrd auth login", href: "/docs/commands/auth-login" },
    { label: "cxgrd doctor", href: "/docs/commands/doctor" },
    { label: "cxgrd init-hooks", href: "/docs/commands/init-hooks" },
    { label: "cxgrd watch", href: "/docs/commands/watch" },
    { label: "cxgrd check", href: "/docs/commands/check" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "npm package", href: "https://npmjs.com/package/cxgrd", external: true },
    { label: "GitHub", href: "https://github.com/cxgrd", external: true },
    { label: "Status", href: "https://stats.uptimerobot.com/f3AQQEDMx6" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "mailto:hello@cxgrd.com", external: true },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Refund Policy", href: "/legal/refund" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05070f]/70 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        {/* Top row — logo + columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Logo col */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="inline-flex items-center gap-2">
              <Image src="/cxgrdlogo.png" alt="cxgrd" width={28} height={28} className="rounded-md" />
            </a>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Architecture-aware guardrails for AI-assisted development.
            </p>
          </div>

          {/* Link columns */}
          <div className="col-span-2 md:col-span-5 ml-auto">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {Object.entries(footerLinks).map(([group, links]) => (
                <div key={group}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {group}
                  </p>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        {'external' in link && link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-500 transition-colors hover:text-slate-200"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-sm text-slate-500 transition-colors hover:text-slate-200"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} cxgrd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
