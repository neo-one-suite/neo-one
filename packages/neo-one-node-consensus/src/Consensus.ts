/// <reference types="@reactivex/ix-es2015-cjs" />
import { common, crypto, ECPoint, PrivateKey, UInt160 } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import { ConsensusPayload, Node, Transaction } from '@neo-one/node-core';
import { finalize, mergeScanLatest, utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { scan } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/scan';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { initializeNewConsensus } from './common';
import { ConsensusContext } from './ConsensusContext';
import { ConsensusQueue } from './ConsensusQueue';
import { Context } from './context';
import { handleConsensusPayload } from './handleConsensusPayload';
import { handlePersistBlock } from './handlePersistBlock';
import { handleTransactionReceived } from './handleTransactionReceived';
import { runConsensus } from './runConsensus';
import { Event, Result } from './types';

export interface Options {
  readonly privateKey: string;
  readonly privateNet: boolean;
}
export interface InternalOptions {
  readonly privateKey: PrivateKey;
  readonly publicKey: ECPoint;
  readonly feeAddress: UInt160;
  readonly privateNet: boolean;
}

const MS_IN_SECOND = 1000;

export class Consensus {
  private mutableQueue: ConsensusQueue;
  private mutableTimer: number | undefined;
  private readonly options$: Observable<InternalOptions>;
  private readonly node: Node;
  private mutableConsensusContext: ConsensusContext;
  private readonly monitor: Monitor;
  private mutableStartPromise: Promise<void> | undefined;

  public constructor({
    options$,
    node,
    monitor,
  }: {
    readonly options$: Observable<Options>;
    readonly node: Node;
    readonly monitor: Monitor;
  }) {
    this.mutableQueue = new ConsensusQueue();
    this.options$ = options$.pipe(
      map((options) => {
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
    );

    this.node = node;
    this.mutableConsensusContext = new ConsensusContext();
    this.monitor = monitor.at('node_consensus');
  }

  public start$(): Observable<void> {
    return this.options$.pipe(
      mergeScanLatest<InternalOptions, void>(async (_, options) => {
        await this.pause();
        this.doStart(options);
      }),
      finalize(async () => {
        await this.pause();
      }),
    );
  }

  public onPersistBlock(): void {
    this.mutableQueue.write({ type: 'handlePersistBlock' });
  }

  public onConsensusPayloadReceived(payload: ConsensusPayload): void {
    this.mutableQueue.write({
      type: 'handleConsensusPayload',
      payload,
    });
  }

  public onTransactionReceived(transaction: Transaction): void {
    this.mutableQueue.write({
      type: 'handleTransactionReceived',
      transaction,
    });
  }

  public async runConsensusNow(): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      // tslint:disable-next-line promise-must-complete
      await new Promise((resolve, reject) => {
        this.mutableQueue.write({ type: 'timer', promise: { resolve, reject } });
      });
    } else {
      throw new Error('Can only force consensus on a private network.');
    }
  }

  public nowSeconds(): number {
    return this.mutableConsensusContext.nowSeconds();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this.mutableConsensusContext.fastForwardOffset(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this.mutableConsensusContext.fastForwardToTime(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  public async pause(): Promise<void> {
    this.clearTimer();
    this.mutableQueue.done();
    this.mutableQueue = new ConsensusQueue();
    if (this.mutableStartPromise !== undefined) {
      await this.mutableStartPromise;
    }
  }

  public async reset(): Promise<void> {
    this.mutableConsensusContext = new ConsensusContext();
  }

  public async resume(): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    // tslint:disable-next-line no-floating-promises
    this.doStart(options);
  }

  private doStart(options: InternalOptions): void {
    let completed = false;
    const mutableStartPromise = this.start(options).then(() => {
      completed = true;
      this.mutableStartPromise = undefined;
    });
    if (!completed) {
      this.mutableStartPromise = mutableStartPromise;
    }
  }

  private async start(options: InternalOptions): Promise<void> {
    this.monitor.log({
      name: 'neo_consensus_start',
      message: 'Consensus started.',
      level: 'verbose',
    });

    const initialResult = await initializeNewConsensus({
      blockchain: this.node.blockchain,
      publicKey: options.publicKey,
      consensusContext: this.mutableConsensusContext,
    });

    await AsyncIterableX.from(this.mutableQueue)
      .pipe(
        scan(async (context: Context, event: Event) => {
          let result;
          switch (event.type) {
            case 'handlePersistBlock':
              result = await handlePersistBlock({
                blockchain: this.node.blockchain,
                publicKey: options.publicKey,
                consensusContext: this.mutableConsensusContext,
              });

              break;
            case 'handleConsensusPayload':
              result = await handleConsensusPayload({
                context,
                node: this.node,
                privateKey: options.privateKey,
                payload: event.payload,
                consensusContext: this.mutableConsensusContext,
              });

              break;
            case 'handleTransactionReceived':
              result = await handleTransactionReceived({
                context,
                node: this.node,
                privateKey: options.privateKey,
                transaction: event.transaction,
                consensusContext: this.mutableConsensusContext,
              });

              break;
            case 'timer':
              result = await runConsensus({
                context,
                node: this.node,
                options,
                consensusContext: this.mutableConsensusContext,
              }).catch((err) => {
                if (event.promise !== undefined) {
                  event.promise.reject(err);
                }
                throw err;
              });
              if (event.promise !== undefined) {
                event.promise.resolve();
              }
              break;
            default:
              commonUtils.assertNever(event);
              throw new Error('For TS');
          }

          return this.handleResult(result);
        }, this.handleResult(initialResult)),
      )
      .forEach(() => {
        // do nothing
      });

    this.monitor.log({
      name: 'neo_consensus_stop',
      message: 'Consensus stopped.',
      level: 'verbose',
    });
  }

  private handleResult(result: Result<Context>): Context {
    if (result.timerSeconds !== undefined) {
      this.handleTimer(result.timerSeconds);
    }

    return result.context;
  }

  private handleTimer(mutableTimerSeconds: number): void {
    this.clearTimer();
    this.mutableTimer = setTimeout(
      () => this.mutableQueue.write({ type: 'timer' }),
      mutableTimerSeconds * MS_IN_SECOND,
      // tslint:disable-next-line no-any
    ) as any;
  }

  private clearTimer(): void {
    if (this.mutableTimer !== undefined) {
      clearTimeout(this.mutableTimer);
      this.mutableTimer = undefined;
    }
  }
}
