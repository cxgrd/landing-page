import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Command - doctor | CXGRD Docs',
    description : 'Check the readiness and availability of tools before starting strict checks'
};

export default function Page() {
  return <Content />;
}