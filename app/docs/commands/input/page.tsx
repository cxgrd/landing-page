import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Command - input | CXGRD Docs',
    description : 'Calculate the blast radius of a change using the dependency graph created by cxgrd scan'
};

export default function Page() {
  return <Content />;
}