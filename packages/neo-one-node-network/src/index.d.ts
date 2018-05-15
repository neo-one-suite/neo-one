import { Endpoint } from '@neo-one/node-core';

export interface ListenTCP {
  port: number;
  host?: string;
}

export interface NetworkEnvironment {
  listenTCP?: ListenTCP;
}

export interface NetworkOptions {
  seeds?: Endpoint[];
  peerSeeds?: Endpoint[];
  maxConnectedPeers?: number;
  externalEndpoints?: Endpoint[];
  connectPeersDelayMS?: number;
  socketTimeoutMS?: number;
  connectErrorCodes?: string[];
}
