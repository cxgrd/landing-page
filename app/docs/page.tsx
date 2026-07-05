import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'CXGRD Docs',
  description: 'Getting started with CXGRD. Understanding what it is and what does a typical workflow look like.',
};

export default function Page() {
  return <Content />;
}