import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
  title: 'Prevent AI Code From Breaking Types in a Monorepo | CXGRD',
  description: 'How to catch cross-package type breakage from AI-generated code before it merges, using blast radius analysis.',
}

export default function Page() {
  return <Content />;
}