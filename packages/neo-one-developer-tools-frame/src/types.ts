// tslint:disable no-any no-unused
import { AddressString } from '@neo-one/client-common';
import { Client, DeveloperClient, LocalClient } from '@neo-one/client-core';

export interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export interface OnResizeOptions {
  readonly width: string;
  readonly height: string;
}
export type OnResize = (options: OnResizeOptions) => void;

export interface DeveloperToolsOptions {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
  readonly maxWidth: number;
  readonly onResize: OnResize;
}

export interface Token {
  readonly network: string;
  readonly address: AddressString;
  readonly symbol: AddressString;
  readonly decimals: number;
}
