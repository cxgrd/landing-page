import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Command - prompt | CXGRD Docs',
    description : 'Get a more architecturally accurate prompt for your AI tool using prompt command'
};

export default function Page() {
  return <Content />;
}