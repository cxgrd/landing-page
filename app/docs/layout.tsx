import DocsLayoutClient from './layout-client'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>
}