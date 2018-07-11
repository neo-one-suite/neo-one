import { common, ConsensusPayload, crypto, ECPoint, PrivateKey, Transaction, UInt160 } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { finalize, mergeScanLatest, utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-esnext-esm/asynciterable/asynciterablex';
import { scan } from '@reactivex/ix-esnext-esm/asynciterable/pipe/scan';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { Node } from '../Node';
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
  private mutableTimer: NodeJS.Timer | undefined;
  private readonly options$: Observable<InternalOptions>;
  private readonly node: Node;
  private readonly consensusContext: ConsensusContext;
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
    this.consensusContext = new ConsensusContext();
    this.monitor = monitor.at('node_consensus');
  }

  public start$(): Observable<void> {
    return this.options$.pipe(
      switchMap(async (options) => {
        if (this.mutableStartPromise !== undefined) {
          await this.pause();
        }

        return options;
      }),
      mergeScanLatest<InternalOptions, void>(async (_, options) => {
        await this.doStart(options);
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
      this.mutableQueue.write({ type: 'timer' });
    } else {
      throw new Error('Can only force consensus on a private network.');
    }
  }

  public nowSeconds(): number {
    return this.consensusContext.nowSeconds();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this.consensusContext.fastForwardOffset(seconds);
    } else {
      throw new Error('Can only fast forward on a private network.');
    }
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    if (options.privateNet) {
      this.consensusContext.fastForwardToTime(seconds);
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

  public async resume(): Promise<void> {
    const options = await this.options$.pipe(take(1)).toPromise();
    // tslint:disable-next-line no-floating-promises
    this.doStart(options);
  }

  private async doStart(options: InternalOptions): Promise<void> {
    let completed = false;
    const mutableStartPromise = this.start(options).then(() => {
      completed = true;
      this.mutableStartPromise = undefined;
    });
    if (!completed) {
      this.mutableStartPromise = mutableStartPromise;
      await this.mutableStartPromise;
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
      consensusContext: this.consensusContext,
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
                consensusContext: this.consensusContext,
              });

              break;
            case 'handleConsensusPayload':
              result = await handleConsensusPayload({
                context,
                node: this.node,
                privateKey: options.privateKey,
                payload: event.payload,
                consensusContext: this.consensusContext,
              });

              break;
            case 'handleTransactionReceived':
              result = await handleTransactionReceived({
                context,
                node: this.node,
                privateKey: options.privateKey,
                transaction: event.transaction,
                consensusContext: this.consensusContext,
              });

              break;
            case 'timer':
              result = await runConsensus({
                context,
                node: this.node,
                options,
                consensusContext: this.consensusContext,
              });

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
    );
  }

  private clearTimer(): void {
    if (this.mutableTimer !== undefined) {
      clearTimeout(this.mutableTimer);
      this.mutableTimer = undefined;
    }
  }
}
