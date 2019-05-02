import { ConnectedPeer, Endpoint } from '@neo-one/node-core';

export class Network<Message, PeerData> {
  public readonly connectedPeers: readonly ConnectedPeer<Message, PeerData>[] = [];
  public blacklistAndClose(_peer: ConnectedPeer<Message, PeerData>): void {
    // do nothing
  }
  public start(): void {
    // do nothing
  }
  public stop(): void {
    // do nothing
  }
  public relay(_buffer: Buffer): void {
    // do nothing
  }
  public permanentlyBlacklist(_endpoint: Endpoint): void {
    // do nothing
  }
  public addEndpoint(_endpoint: Endpoint): void {
    // do nothing
  }
}
