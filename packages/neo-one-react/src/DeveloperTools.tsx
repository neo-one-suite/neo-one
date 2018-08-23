import { Client, DeveloperClient } from '@neo-one/client';
import { Client as OneClient } from '@neo-one/server-http-client';
import { DeveloperToolsDev, DeveloperToolsProd } from './one';

interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export interface Props {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly oneClients: NetworkClients<OneClient>;
  readonly projectID: string;
}

export const DeveloperTools = process.env.NODE_ENV === 'production' ? DeveloperToolsProd : DeveloperToolsDev;
