import { NetworkEnvironment, NetworkOptions } from '@neo-one/node-network';

export interface ConsensusOptions {
  privateKey: string;
  privateNet: boolean;
}

export interface NodeEnvironment {
  network?: NetworkEnvironment;
}

export interface NodeOptions {
  consensus?: {
    enabled: boolean;
    options: ConsensusOptions;
  };
  network?: NetworkOptions;
  rpcURLs?: Array<string>;
}
