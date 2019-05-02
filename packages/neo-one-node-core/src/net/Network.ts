import { Duplex } from 'stream';
import { ConnectedPeer } from './ConnectedPeer';
import { OnNetworkEvent } from './event';
import { Peer } from './Peer';
import { Endpoint } from './types';

export interface PeerHealthBase {
  readonly healthy: boolean;
}

export interface NegotiateResult<PeerData> {
  readonly data: PeerData;
  readonly relay: boolean;
}

export interface Network<Message, PeerData> {
  readonly connectedPeers: readonly ConnectedPeer<Message, PeerData>[];
  readonly blacklistAndClose: (peer: ConnectedPeer<Message, PeerData>) => void;
  readonly start: () => void;
  readonly stop: () => void;
  readonly relay: (buffer: Buffer) => void;
  readonly permanentlyBlacklist: (endpoint: Endpoint) => void;
  readonly addEndpoint: (endpoint: Endpoint) => void;
}

export interface NetworkCreateOptions<Message, PeerData, PeerHealth extends PeerHealthBase> {
  readonly negotiate: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>;
  readonly checkPeerHealth: (
    connectedPeer: ConnectedPeer<Message, PeerData>,
    previousHealth?: PeerHealth,
  ) => PeerHealth;
  readonly createMessageTransform: () => Duplex;
  readonly onMessageReceived: (peer: ConnectedPeer<Message, PeerData>, message: Message) => void;
  readonly onRequestEndpoints: () => void;
  readonly onEvent?: OnNetworkEvent<Message, PeerData>;
}

export type CreateNetwork = <Message, PeerData, PeerHealth extends PeerHealthBase>(
  options: NetworkCreateOptions<Message, PeerData, PeerHealth>,
) => Network<Message, PeerData>;
