import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
  metadataBase: new URL("https://cxgrd.com"),
  title: 'Prevent AI Code From Breaking Types in a Monorepo | CXGRD',
  description: 'How to catch cross-package type breakage from AI-generated code before it merges, using blast radius analysis.',
  alternates: {
    canonical: "/solutions/pacbtm",
  }
}

export default function Page() {
  return <Content />;
}