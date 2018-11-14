import { Client, DeveloperClient, LocalClient } from '@neo-one/client-core';

export interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export interface DeveloperToolsOptions {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
}

export interface DeveloperToolsOptionsInternal extends DeveloperToolsOptions {
  readonly maxWidth: number;
  readonly onResize: (options: { readonly width: string; readonly height: string }) => void;
}
