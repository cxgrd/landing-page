import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
  title: 'Preventing AI Hallucinations | CXGRD',
  description: 'How CXGRD acts as a local guardrail, running compiler checks and structural diffs right after the AI outputs code to catch and reject syntax errors before they ever hit the main branch.',
}

export default function Page() {
  return <Content />;
}