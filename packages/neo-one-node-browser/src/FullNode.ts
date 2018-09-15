import { common, crypto } from '@neo-one/client-core';
import { DefaultMonitor, Monitor } from '@neo-one/monitor';
import { Blockchain } from '@neo-one/node-blockchain';
import { createMain } from '@neo-one/node-neo-settings';
import { Node } from '@neo-one/node-protocol';
import { createHandler, RPCHandler } from '@neo-one/node-rpc-handler';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import { finalize } from '@neo-one/utils';
// tslint:disable-next-line match-default-export-name
import leveljs from 'level-js';
import LevelUp from 'levelup';
import { BehaviorSubject, Subscription } from 'rxjs';
import { constants } from './constants';
import { Network } from './Network';

export class FullNode {
  private readonly monitor: Monitor;
  private mutableSubscription: Subscription | undefined;
  private readonly startPromise: Promise<RPCHandler>;

  public constructor() {
    this.monitor = DefaultMonitor.create({ service: 'node' });
    this.startPromise = this.startInternal();
  }

  public async start(): Promise<void> {
    return this.startPromise.then(() => {
      // do nothing
    });
  }

  public async stop(): Promise<void> {
    if (this.mutableSubscription !== undefined) {
      this.mutableSubscription.unsubscribe();
      this.mutableSubscription = undefined;
      await finalize.wait();
    }
  }

  // tslint:disable-next-line no-any
  public async handleRequest(data: any): Promise<any> {
    const handler = await this.startPromise;

    return handler(data, this.monitor);
  }

  private async startInternal(): Promise<RPCHandler> {
    let resolved = false;
    const primaryPrivateKey = crypto.wifToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY, common.NEO_PRIVATE_KEY_VERSION);
    const primaryPublicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
    crypto.addPublicKey(primaryPrivateKey, primaryPublicKey);

    const settings = createMain({
      address: common.uInt160ToString(crypto.privateKeyToScriptHash(primaryPrivateKey)),
      standbyValidators: [common.ecPointToString(primaryPublicKey)],
    });
    const storage = levelupStorage({
      db: LevelUp(leveljs('neo-one-node')),
      context: { messageMagic: settings.messageMagic },
    });

    const blockchain = await Blockchain.create({
      settings,
      storage,
      vm,
      monitor: this.monitor,
    });
    const nodeOptions$ = new BehaviorSubject({
      consensus: {
        enabled: true,
        options: {
          privateKey: common.privateKeyToString(primaryPrivateKey),
          privateNet: true,
        },
      },
    });
    const node = new Node({
      monitor: this.monitor,
      blockchain,
      environment: {},
      options$: nodeOptions$,
      createNetwork: () => new Network(),
    });

    await new Promise<void>((resolve, reject) => {
      const handleError = (error: Error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      };
      this.mutableSubscription = node.start$().subscribe({
        next: () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        },
        error: handleError,
        complete: () => {
          handleError(new Error('Unexpected end'));
        },
      });
    });

    return createHandler({ blockchain, node });
  }
}
