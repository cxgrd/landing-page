import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Command - scan | CXGRD Docs',
    description : 'Analyze your project directory and build dependency graph, helps in calculating blast radius for changes'
};

export default function Page() {
  return <Content />;
}