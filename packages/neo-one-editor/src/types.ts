import * as React from 'react';

// tslint:disable-next-line no-any
export type ComponentProps<C extends React.ComponentType<any>> = C extends React.ComponentType<infer P> ? P : never;

export interface FileMetadata {
  readonly writable: boolean;
}

export interface FileSystemMetadata {
  readonly fileMetadata: { readonly [path: string]: FileMetadata };
  readonly files: ReadonlyArray<string>;
}
