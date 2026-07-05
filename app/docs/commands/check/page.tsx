import Content from './content.mdx';
import {Metadata} from 'next';

export const metadata : Metadata = {
    title : 'Command - check | CXGRD Docs',
    description : 'The check command for CXGRD. Validate your project with compiler-backed checks, posts results to server and evaluate merge policies'
};

export default function Page() {
  return <Content />;
}