// tslint:disable no-any no-unused
import * as React from 'react';

export type ComponentProps<C extends React.ComponentType<any> | React.Component<any>> = C extends React.ComponentType<
  infer P
>
  ? P
  : C extends React.Component<infer P1> ? P1 : never;
// tslint:disable-next-line no-any
export type ReactSyntheticEvent = React.SyntheticEvent<any>;

export interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export type ChildrenProps<C extends React.ComponentType<any> | React.Component<any>> = C extends React.ComponentType<{
  readonly children: (p: infer P) => any;
}>
  ? P
  : C extends React.Component<{ readonly children: (p: infer P1) => any }> ? P1 : never;

export interface LocalClient {
  readonly getNEOTrackerURL: () => Promise<string | undefined>;
  readonly reset: () => Promise<void>;
}
