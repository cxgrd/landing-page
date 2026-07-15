import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
  title: 'Reviewing AI pull requests at scale | CXGRD',
  description: 'How to review AI-generated pull requests at org level with CXGRD.',
}

export default function Page() {
  return <Content />;
}