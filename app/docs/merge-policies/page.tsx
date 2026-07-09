import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Merge Policies | CXGRD Docs',
    description : 'Learn how CXGRD enforces merge policies using deterministic blast radius calculation before code ships.'
};

export default function Page() {
  return <Content />;
}