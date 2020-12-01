/// <reference types="@reactivex/ix-es2015-cjs" />
import { common, crypto, ECPoint, PrivateKey, UInt160, UInt256Hex } from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import { ConsensusContext, ConsensusPayload, Node, Transaction } from '@neo-one/node-core';
import { composeDisposables, Disposable, noopDisposable, utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { scan } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/scan';
import { initializeNewConsensus } from './common';
import { ConsensusQueue } from './ConsensusQueue';
import { handleConsensusPayload } from './handleConsensusPayload';
import { handlePersistBlock } from './handlePersistBlock';
import { handleTransactionReceived } from './handleTransactionReceived';
import { runConsensus } from './runConsensus';
import { TimerContext } from './TimerContext';
import { Event, Result } from './types';

const logger = createChild(nodeLogger, { component: 'consensus' });

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
  private readonly options: InternalOptions;
  private readonly node: Node;
  private mutableTimerContext: TimerContext;
  private mutableStartPromise: Promise<void> | undefined;
  private readonly knownHashes = new Set<UInt256Hex>();

  public constructor({ options, node }: { readonly options: Options; readonly node: Node }) {
    this.mutableQueue = new ConsensusQueue();

    const privateKey = common.stringToPrivateKey(options.privateKey);
    const publicKey = crypto.privateKeyToPublicKey(privateKey);
    const feeAddress = crypto.publicKeyToScriptHash(publicKey);
    this.options = {
      privateKey,
      publicKey,
      feeAddress,
      privateNet: options.privateNet,
    };

    this.node = node;
    this.mutableTimerContext = new TimerContext();
  }

  public async start(): Promise<Disposable> {
    let disposable = noopDisposable;
    try {
      await this.pause();
      this.doStart(this.options);

      disposable = composeDisposables(disposable, async () => {
        await this.pause();
      });

      return disposable;
    } catch (err) {
      await disposable();
      throw err;
    }
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
    if (this.options.privateNet) {
      // tslint:disable-next-line promise-must-complete
      await new Promise((resolve, reject) => {
        this.mutableQueue.write({ type: 'timer', promise: { resolve, reject } });
      });
    } else {
      throw new Error('Can only force consensus on a private network.');
    }
  }

  public nowSeconds(): number {
    return this.mutableTimerContext.nowSeconds();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    if (this.options.privateNet) {
      this.mutableTimerContext.fastForwardOffset(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    if (this.options.privateNet) {
      this.mutableTimerContext.fastForwardToTime(seconds);
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
    this.mutableTimerContext = new TimerContext();
  }

  public async resume(): Promise<void> {
    // tslint:disable-next-line no-floating-promises
    this.doStart(this.options);
  }

  private doStart(options: InternalOptions): void {
    let completed = false;
    const mutableStartPromise = this.startInternal(options).then(() => {
      completed = true;
      this.mutableStartPromise = undefined;
    });
    if (!completed) {
      this.mutableStartPromise = mutableStartPromise;
    }
  }

  private async startInternal(options: InternalOptions): Promise<void> {
    logger.info({ name: 'neo_consensus_start' }, 'Consensus started.');

    const initialResult = await initializeNewConsensus({
      blockchain: this.node.blockchain,
      publicKey: options.publicKey,
      privateKey: options.privateKey,
      timerContext: this.mutableTimerContext,
      verificationContext: this.node.getNewVerificationContext(),
    });

    await AsyncIterableX.from(this.mutableQueue)
      .pipe(
        scan(async (context: ConsensusContext, event: Event) => {
          let result;
          switch (event.type) {
            case 'handlePersistBlock':
              result = await handlePersistBlock({
                context,
                blockchain: this.node.blockchain,
                privateKey: options.privateKey,
                timerContext: this.mutableTimerContext,
              });
              this.knownHashes.clear();

              break;
            case 'handleConsensusPayload':
              result = await handleConsensusPayload({
                context,
                node: this.node,
                knownHashes: this.knownHashes,
                privateKey: options.privateKey,
                payload: event.payload,
                timerContext: this.mutableTimerContext,
              });

              break;
            case 'handleTransactionReceived':
              result = await handleTransactionReceived({
                context,
                node: this.node,
                privateKey: options.privateKey,
                transaction: event.transaction,
                timerContext: this.mutableTimerContext,
              });

              break;
            case 'timer':
              result = await runConsensus({
                context,
                node: this.node,
                options,
                timerContext: this.mutableTimerContext,
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

    logger.info({ name: 'neo_consensus_stop' }, 'Consensus stopped.');
  }

  private handleResult(result: Result): ConsensusContext {
    if (result.timerMS !== undefined) {
      this.handleTimer(result.timerMS);
    }

    return result.context;
  }

  private handleTimer(mutableTimerMS: number): void {
    this.clearTimer();
    this.mutableTimer = setTimeout(
      () => this.mutableQueue.write({ type: 'timer' }),
      mutableTimerMS,
      // tslint:disable-next-line no-any no-useless-cast
    ) as any;
  }

  private clearTimer(): void {
    if (this.mutableTimer !== undefined) {
      clearTimeout(this.mutableTimer);
      this.mutableTimer = undefined;
    }
  }
}
