import {Metadata} from 'next';
import Content from './content.mdx';

export const metadata : Metadata = {
  title: 'Deterministic Analysis vs. AI Agents | CXGRD Docs',
  description: 'Why CXGRD uses dependency graph traversal instead of AI agent interpretation to compute blast radius.',
}

export default function Page() {
  return <Content />;
}