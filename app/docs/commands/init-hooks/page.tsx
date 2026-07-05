import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Command - init-hooks | CXGRD Docs',
    description : 'Run checks automatically before commits with cxgrd init-hooks'
};

export default function Page() {
  return <Content />;
}