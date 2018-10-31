import { AddressString } from '@neo-one/client-common';
import * as React from 'react';

// tslint:disable-next-line no-any
export type ComponentProps<C extends React.ComponentType<any>> = C extends React.ComponentType<infer P> ? P : never;

export interface File {
  readonly path: string;
  readonly writable: boolean;
}

export interface Token {
  readonly network: string;
  readonly address: AddressString;
  readonly symbol: AddressString;
  readonly decimals: number;
}
