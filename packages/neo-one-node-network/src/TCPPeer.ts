import { Endpoint, getEndpointConfig, Peer } from '@neo-one/node-core';
import * as net from 'net';
import { Duplex } from 'stream';
import { SocketTimeoutError } from './errors';

interface TCPPeerOptions<Message> {
  readonly endpoint: Endpoint;
  readonly socket?: net.Socket;
  readonly transform: Duplex;
  readonly onError: (peer: Peer<Message>, error: Error) => void;
  readonly onClose: (peer: Peer<Message>) => void;
  readonly timeoutMS: number;
}

export class TCPPeer<Message> extends Peer<Message> {
  private readonly socket: net.Socket;
  private readonly host: string;
  private readonly port: number;
  private readonly timeoutMS: number;
  private readonly initialConnected: boolean;

  public constructor({ endpoint, socket: socketIn, transform, onError, onClose, timeoutMS }: TCPPeerOptions<Message>) {
    const socket = socketIn === undefined ? new net.Socket() : socketIn;
    super({
      endpoint,
      stream: socket,
      transform,
      onError,
      onClose,
    });

    this.socket = socket;
    const endpointConfig = getEndpointConfig(endpoint);
    this.host = endpointConfig.host;
    this.port = endpointConfig.port;
    this.timeoutMS = timeoutMS;
    this.initialConnected = socketIn !== undefined;
  }

  protected async connectInternal(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let handled = false;
      const onDone = () => {
        if (!handled) {
          handled = true;
          this.socket.setTimeout(this.timeoutMS, () => {
            this.onError(new SocketTimeoutError(this.socket.localAddress, this.socket.localPort));
          });
          resolve();
        }
      };
      const onError = (error: Error) => {
        if (!handled) {
          handled = true;
          reject(error);
        }
      };
      this.socket.once('error', (error) => {
        onError(error);
      });
      this.socket.once('close', () => {
        onError(new Error('Closed'));
      });
      if (this.initialConnected) {
        onDone();
      } else {
        this.socket.connect(
          {
            host: this.host,
            port: this.port,
          },
          onDone,
        );
      }
    });
  }

  protected closeInternal(hadError: boolean): void {
    if (!hadError) {
      this.socket.end();
    }
    this.socket.destroy();
  }
}
