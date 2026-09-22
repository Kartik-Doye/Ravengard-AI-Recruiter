declare module 'react-dom/client' {
  import { ReactNode } from 'react';

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: ReactNode): Root;
}

declare module '@testing-library/react' {
  export function renderHook<Result, Props>(
    render: (props: Props) => Result,
    options?: any
  ): {
    result: { current: Result };
    rerender: (props?: Props) => void;
    unmount: () => void;
  };

  export function act(callback: () => void | Promise<void>): Promise<void> | void;
}

