import { Client, DeveloperClient } from '@neo-one/client-core';

export interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export interface DeveloperToolsOptions {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
}

export interface DeveloperToolsOptionsInternal extends DeveloperToolsOptions {
  readonly maxWidth: number;
  readonly onResize: (options: { readonly width: string; readonly height: string }) => void;
}
