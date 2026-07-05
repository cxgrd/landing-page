import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Command - watch | CXGRD Docs',
    description : 'Monitor your codebase for dependency changes in real time'
};

export default function Page() {
  return <Content />;
}