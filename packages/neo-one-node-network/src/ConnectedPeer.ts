import { Endpoint } from '@neo-one/node-core';
import { Peer } from './Peer';

interface ConnectedPeerOptions<Message, PeerData> {
  readonly peer: Peer<Message>;
  readonly data: PeerData;
  readonly relay: boolean;
}

export class ConnectedPeer<Message, PeerData> {
  public readonly data: PeerData;
  public readonly peer: Peer<Message>;
  public readonly relay: boolean;

  public constructor(options: ConnectedPeerOptions<Message, PeerData>) {
    this.data = options.data;
    this.peer = options.peer;
    this.relay = options.relay;
  }

  public get endpoint(): Endpoint {
    return this.peer.endpoint;
  }

  public get connected(): boolean {
    return this.peer.connected;
  }

  public close(): void {
    this.peer.close();
  }

  public write(buffer: Buffer): void {
    this.peer.write(buffer);
  }
}
