import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Team | CXGRD Docs',
    description : 'Learn about the Team tier, how it works, merge policy enforcement and audit logs'
}

export default function Page() {
  return <Content />;
}