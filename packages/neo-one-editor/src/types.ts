import * as React from 'react';
import { Engine } from './engine';

// tslint:disable-next-line no-any
export type ComponentProps<C extends React.ComponentType<any>> = C extends React.ComponentType<infer P> ? P : never;

export interface EngineContentFile {
  readonly path: string;
  readonly content: string;
  readonly writable: boolean;
  readonly open: boolean;
}

export type EngineContentFiles = ReadonlyArray<EngineContentFile>;

export interface FileMetadata {
  readonly writable: boolean;
}

export interface FileSystemMetadata {
  readonly fileMetadata: { readonly [path: string]: FileMetadata };
  readonly files: ReadonlyArray<string>;
}

export interface EditorContext {
  readonly engine: Engine;
}
