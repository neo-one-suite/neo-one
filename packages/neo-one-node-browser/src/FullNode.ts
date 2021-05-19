import { common, crypto } from '@neo-one/client-common';
import { DeveloperClient } from '@neo-one/client-core';
import { Blockchain } from '@neo-one/node-blockchain';
import { createMain } from '@neo-one/node-neo-settings';
import { Node } from '@neo-one/node-protocol';
import { createHandler, RPCHandler } from '@neo-one/node-rpc-handler';
import { storage as levelupStorage } from '@neo-one/node-storage-levelup';
import { vm } from '@neo-one/node-vm';
import { Disposable } from '@neo-one/utils';
import Level from 'level-js';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { constants } from './constants';
import { Network } from './Network';

export interface PersistentFullNode {
  readonly type: 'persistent';
  readonly id: string;
}

export interface InMemoryFullNode {
  readonly type: 'memory';
}

export type FullNodeOptions = PersistentFullNode | InMemoryFullNode;

export class FullNode {
  private mutableDisposable: Disposable | undefined;
  private readonly startPromise: Promise<RPCHandler>;

  public constructor(
    private readonly options: FullNodeOptions,
    private readonly developerClient: DeveloperClient,
    private readonly build: () => Promise<void>,
  ) {
    this.startPromise = this.startInternal();
  }

  public async start(): Promise<void> {
    return this.startPromise.then(() => {
      // do nothing
    });
  }

  public async stop(): Promise<void> {
    if (this.mutableDisposable !== undefined) {
      await this.mutableDisposable();
      this.mutableDisposable = undefined;
    }
  }

  // tslint:disable-next-line no-any
  public async handleRequest(data: any): Promise<any> {
    const handler = await this.startPromise;

    return handler(data);
  }

  private async startInternal(): Promise<RPCHandler> {
    const primaryPrivateKey = common.stringToPrivateKey(constants.PRIVATE_NET_PRIVATE_KEY);
    const primaryPublicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
    crypto.addPublicKey(primaryPrivateKey, primaryPublicKey);

    const settings = createMain({
      address: common.uInt160ToString(crypto.privateKeyToScriptHash(primaryPrivateKey)),
      standbyValidators: [common.ecPointToString(primaryPublicKey)],
      privateNet: true,
    });
    const storage = levelupStorage({
      db: LevelUp(this.options.type === 'persistent' ? Level(this.options.id) : MemDown()),
      context: { network: settings.network },
    });

    const blockchain = await Blockchain.create({
      settings,
      storage,
      vm,
    });
    const nodeOptions = {
      consensus: {
        privateKey: common.privateKeyToString(primaryPrivateKey),
        privateNet: true,
      },
    };
    const node = new Node({
      blockchain,
      options: nodeOptions,
      createNetwork: () => new Network(),
    });

    this.mutableDisposable = await node.start();

    return createHandler({
      blockchain,
      node,
      handleResetProject: this.reset.bind(this),
      handleGetNEOTrackerURL: async () => undefined,
    });
  }

  private async reset(): Promise<void> {
    await this.developerClient.reset();
    await this.developerClient.updateSettings({ secondsPerBlock: 15 });

    await this.build();
  }
}
