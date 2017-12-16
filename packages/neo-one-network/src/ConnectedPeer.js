/* @flow */
import type { Endpoint } from '@neo-one/node-core';

import type Peer from './Peer';

type ConnectedPeerOptions<Message, PeerData> = {|
  peer: Peer<Message>,
  data: PeerData,
  relay: boolean,
|};
export default class ConnectedPeer<Message, PeerData> {
  data: PeerData;
  peer: Peer<Message>;
  relay: boolean;

  constructor(options: ConnectedPeerOptions<Message, PeerData>) {
    this.data = options.data;
    this.peer = options.peer;
    this.relay = options.relay;
  }

  get endpoint(): Endpoint {
    return this.peer.endpoint;
  }

  get connected(): boolean {
    return this.peer.connected;
  }

  close(): void {
    this.peer.close();
  }

  write(buffer: Buffer): void {
    this.peer.write(buffer);
  }
}
