declare module '*.mdx' {
  import type { ComponentType, JSX } from 'react';
  const component: ComponentType<any>;
  export default component;
}