import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata: Metadata = {
    title : 'Installation | CXGRD Docs',
    description : 'Learn about the requirements for running, installing and using CXGRD '
};

export default function Page() {
  return <Content />;
}