import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Command - config | CXGRD Docs',
    description : 'The config command, used for managing configurations'
};

export default function Page() {
  return <Content />;
}