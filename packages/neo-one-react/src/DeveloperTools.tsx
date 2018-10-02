import { Client, DeveloperClient } from '@neo-one/client';
import { DeveloperToolsDev } from './one/DeveloperToolsDev';
import { DeveloperToolsProd } from './one/DeveloperToolsProd';
import { LocalClient } from './types';

interface NetworkClients<T> {
  readonly [network: string]: T | undefined;
}

export interface Props {
  readonly client: Client;
  readonly developerClients: NetworkClients<DeveloperClient>;
  readonly localClients: NetworkClients<LocalClient>;
}

export const DeveloperTools = process.env.NODE_ENV === 'production' ? DeveloperToolsProd : DeveloperToolsDev;
