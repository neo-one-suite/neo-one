import { Endpoint } from '@neo-one/node-core';
import { Duplex } from 'stream';
import through from 'through';
import { ReceiveMessageTimeoutError } from './errors';

export interface PeerOptions<Message> {
  readonly endpoint: Endpoint;
  readonly stream: Duplex;
  readonly transform: Duplex;
  readonly onError: (peer: Peer<Message>, error: Error) => void;
  readonly onClose: (peer: Peer<Message>) => void;
}

export abstract class Peer<Message> {
  public readonly endpoint: Endpoint;
  private readonly stream: Duplex;
  private readonly transform: Duplex;
  private readonly buffer: Duplex;
  private mutableConnected: boolean;
  private mutableConnecting: boolean;
  private mutableClosed: boolean;
  private readonly onErrorInternal: (peer: Peer<Message>, error: Error) => void;
  private readonly onCloseInternal: (peer: Peer<Message>) => void;

  public constructor(options: PeerOptions<Message>) {
    this.endpoint = options.endpoint;
    this.mutableConnected = false;

    this.stream = options.stream;
    this.transform = options.transform;
    this.buffer = through();

    this.mutableConnecting = false;
    this.mutableClosed = false;

    this.onErrorInternal = options.onError;
    this.onCloseInternal = options.onClose;

    this.transform.on('error', this.onError.bind(this));
    this.buffer.on('error', this.onError.bind(this));
    this.buffer.pause();
    this.stream.pipe(this.transform).pipe(this.buffer);
  }

  public get connected(): boolean {
    return this.mutableConnected;
  }

  public async connect(): Promise<void> {
    if (this.mutableConnecting || this.mutableConnected) {
      return;
    }
    this.mutableConnecting = true;
    this.mutableClosed = false;

    try {
      await this.connectInternal();
      this.stream.on('error', this.onError.bind(this));
      this.stream.on('close', this.onClose.bind(this));
      this.mutableConnected = true;
    } finally {
      this.mutableConnecting = false;
    }
  }

  public close(hadError?: boolean): void {
    if (this.mutableClosed) {
      return;
    }
    this.mutableClosed = true;

    if (!this.mutableConnecting && !this.mutableConnected) {
      return;
    }
    this.mutableConnecting = false;
    this.mutableConnected = false;

    this.closeInternal(!!hadError);
    this.stream.unpipe(this.transform);
    this.transform.unpipe(this.buffer);
    this.transform.end();
    this.buffer.end();
  }

  public write(buffer: Buffer): void {
    if (!this.mutableConnected || this.mutableClosed) {
      return;
    }

    try {
      this.stream.write(buffer);
    } catch (error) {
      this.onError(error);
    }
  }

  public async receiveMessage(timeoutMS?: number): Promise<Message> {
    return new Promise<Message>((resolve, reject) => {
      let handled = false;
      const cleanup = () => {
        this.buffer.pause();
        handled = true;
        // eslint-disable-next-line
        this.stream.removeListener('error', onError);
        // eslint-disable-next-line
        this.transform.removeListener('error', onError);
        // eslint-disable-next-line
        this.buffer.removeListener('error', onError);
        // eslint-disable-next-line
        this.buffer.removeListener('data', onDataReceived);
      };

      const onError = (error: Error) => {
        if (!handled) {
          cleanup();
          reject(error);
        }
      };

      const onDataReceived = (data: Message) => {
        if (!handled) {
          cleanup();
          resolve(data);
        }
      };

      this.stream.once('error', onError);
      this.transform.once('error', onError);
      this.buffer.once('error', onError);
      this.buffer.once('data', onDataReceived);
      this.buffer.resume();

      if (timeoutMS !== undefined) {
        setTimeout(() => onError(new ReceiveMessageTimeoutError(this.endpoint)), timeoutMS);
      }
    });
  }

  public streamData(onDataReceived: (data: Message) => void): { readonly unsubscribe: () => void } {
    this.buffer.on('data', onDataReceived);
    this.buffer.resume();

    return {
      unsubscribe: () => {
        this.buffer.pause();
        this.buffer.removeListener('data', onDataReceived);
      },
    };
  }

  protected abstract async connectInternal(): Promise<void>;
  protected abstract closeInternal(hadError: boolean): void;

  protected onError(error: Error): void {
    this.close(true);
    this.onErrorInternal(this, error);
  }

  private onClose(): void {
    this.mutableClosed = true;
    this.onCloseInternal(this);
  }
}
