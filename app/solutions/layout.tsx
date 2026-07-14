import SolLayoutClient from './layout-client'

export default function SolLayout({ children }: { children: React.ReactNode }) {
  return <SolLayoutClient>{children}</SolLayoutClient>
}