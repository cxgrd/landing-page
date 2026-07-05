import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Command - auth-login | CXGRD Docs',
    description : 'The authentication command for CXGRD'
};

export default function Page() {
  return <Content />;
}