/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import {
  type ConsensusPayload,
  type ECPoint,
  type PrivateKey,
  type Transaction,
  type UInt160,
  common,
  crypto,
} from '@neo-one/client-core';
import type { Observable } from 'rxjs/Observable';

import { finalize } from '@neo-one/utils';
import { scan } from 'ix/asynciterable/pipe/index';
import { map, switchMap, take } from 'rxjs/operators';

import ConsensusQueue from './ConsensusQueue';
import type { Context } from './context';
import ConsensusContext from './ConsensusContext';
import type { Event, Result } from './types';
import type Node from '../Node';

import handleConsensusPayload from './handleConsensusPayload';
import handlePersistBlock from './handlePersistBlock';
import handleTransactionReceived from './handleTransactionReceived';
import { initializeNewConsensus } from './common';
import runConsensus from './runConsensus';

export type Options = {|
  privateKey: string,
  privateNet: boolean,
|};
export type InternalOptions = {|
  privateKey: PrivateKey,
  publicKey: ECPoint,
  feeAddress: UInt160,
  privateNet: boolean,
|};

const MS_IN_SECOND = 1000;

export default class Consensus {
  _queue: ConsensusQueue;
  _timer: ?TimeoutID;
  _options$: Observable<Options>;
  _node: Node;
  _consensusContext: ConsensusContext;

  constructor({
    options$,
    node,
  }: {|
    options$: Observable<Options>,
    node: Node,
  |}) {
    this._queue = new ConsensusQueue();
    this._timer = null;
    this._options$ = options$;
    this._node = node;
    this._consensusContext = new ConsensusContext();
  }

  start$(): Observable<void> {
    return this._options$.pipe(
      map(options => {
        const privateKey = common.stringToPrivateKey(options.privateKey);
        const publicKey = crypto.privateKeyToPublicKey(privateKey);
        const feeAddress = crypto.publicKeyToScriptHash(publicKey);
        return {
          privateKey,
          publicKey,
          feeAddress,
          privateNet: options.privateNet,
        };
      }),
      switchMap(options => this._start(options)),
      finalize(() => {
        this._clearTimer();
        this._queue.done();
      }),
    );
  }

  async _start(options: InternalOptions): Promise<void> {
    this._node.blockchain.log({ event: 'CONSENSUS_START' });
    const initialResult = await initializeNewConsensus({
      blockchain: this._node.blockchain,
      publicKey: options.publicKey,
      consensusContext: this._consensusContext,
    });

    await AsyncIterableX.from(this._queue)
      .pipe(
        scan(async (context: Context, event: Event) => {
          this._node.blockchain.log({
            event: 'CONSENSUS_QUEUE',
            consensusEvent: event.type,
            context: { ...context.toJSON() },
          });
          let result;
          switch (event.type) {
            case 'handlePersistBlock':
              result = await handlePersistBlock({
                blockchain: this._node.blockchain,
                publicKey: options.publicKey,
                consensusContext: this._consensusContext,
              });
              break;
            case 'handleConsensusPayload':
              result = await handleConsensusPayload({
                context,
                node: this._node,
                privateKey: options.privateKey,
                payload: event.payload,
                consensusContext: this._consensusContext,
              });
              break;
            case 'handleTransactionReceived':
              result = await handleTransactionReceived({
                context,
                node: this._node,
                privateKey: options.privateKey,
                transaction: event.transaction,
                consensusContext: this._consensusContext,
              });
              break;
            case 'timer':
              result = await runConsensus({
                context,
                node: this._node,
                options,
                consensusContext: this._consensusContext,
              });
              break;
            default:
              // eslint-disable-next-line
              (event.type: empty);
              throw new Error('For ESLint');
          }

          return this._handleResult(result);
        }, this._handleResult(initialResult)),
      )
      .forEach(() => {});

    this._node.blockchain.log({ event: 'CONSENSUS_STOP' });
  }

  onPersistBlock(): void {
    this._queue.write({ type: 'handlePersistBlock' });
  }

  onConsensusPayloadReceived(payload: ConsensusPayload): void {
    this._queue.write({
      type: 'handleConsensusPayload',
      payload,
    });
  }

  onTransactionReceived(transaction: Transaction): void {
    this._queue.write({
      type: 'handleTransactionReceived',
      transaction,
    });
  }

  async runConsensusNow(): Promise<void> {
    const options = await this._options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this._queue.write({ type: 'timer' });
    } else {
      throw new Error('Can only force consensus on a private network.');
    }
  }

  nowSeconds(): number {
    return this._consensusContext.nowSeconds();
  }

  async fastForwardOffset(seconds: number): Promise<void> {
    const options = await this._options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this._consensusContext.fastForwardOffset(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  async fastForwardToTime(seconds: number): Promise<void> {
    const options = await this._options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this._consensusContext.fastForwardToTime(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  _handleResult(result: Result<Context>): Context {
    this._node.blockchain.log({
      event: 'CONSENSUS_RESULT',
      timerSeconds: result.timerSeconds,
      context: { ...result.context.toJSON() },
    });
    if (result.timerSeconds != null) {
      this._handleTimer(result.timerSeconds);
    }

    return result.context;
  }

  _handleTimer(timerSeconds: number): void {
    this._clearTimer();
    this._timer = setTimeout(
      () => this._queue.write({ type: 'timer' }),
      timerSeconds * MS_IN_SECOND,
    );
  }

  _clearTimer(): void {
    if (this._timer != null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
