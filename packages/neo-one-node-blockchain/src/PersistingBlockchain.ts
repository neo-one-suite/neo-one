// tslint:disable no-array-mutation no-object-mutation
import { common, UInt256, VMState } from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  // Action,
  // ActionKey,
  // ActionsKey,
  ApplicationExecuted,
  Block,
  // BlockData,
  // BlockDataKey,
  // InvocationData,
  // InvocationDataKey,
  // InvocationResultSuccess,
  // LogAction,
  // NotificationAction,
  // ScriptContainerType,
  ChangeSet,
  HeaderHashList,
  // TransactionData,
  // TransactionDataKey,
  // TransactionDataUpdate,
  HeaderKey,
  SnapshotHandler,
  Storage,
  Transaction,
  TriggerType,
  VM,
} from '@neo-one/node-core';
import { PersistNativeContractsError } from './errors';
import { ReadAddStorageCache } from './StorageCache';
import { utils, utils as blockchainUtils } from './utils';

const logger = createChild(nodeLogger, { service: 'persisting_blockchain' });

interface PersistingBlockchainOptions {
  readonly vm: VM;
  readonly storage: Storage;
  readonly onPersistNativeContractScript: Buffer;
}

interface GetHeaderHashListChangesResult {
  readonly storedCount: number;
  readonly changeSet: ChangeSet;
}

interface Caches {
  readonly headerHashList: ReadAddStorageCache<HeaderKey, HeaderHashList>;
}

// TODO: instead of an array for ApplicationExecuted we should push it to an observable
export class PersistingBlockchain {
  private readonly vm: VM;
  private readonly storage: Storage;
  private readonly onPersistNativeContractScript: Buffer;
  private readonly caches: Caches;

  public constructor(options: PersistingBlockchainOptions) {
    this.vm = options.vm;
    this.storage = options.storage;
    this.onPersistNativeContractScript = options.onPersistNativeContractScript;
    this.caches = {
      headerHashList: new ReadAddStorageCache({
        name: 'headerHashList',
        readStorage: () => this.storage.headerHashList,
        getKeyString: (key) => key.toString(),
        createAddChange: (key, value) => ({ type: 'headerHashList', key, value }),
      }),
    };
  }

  public persistBlock(
    block: Block,
    currentHeaderIndexCount: number,
    // tslint:disable-next-line: readonly-array no-any
  ): { readonly changeBatch: any[]; readonly applicationsExecuted: readonly ApplicationExecuted[] } {
    return this.vm.withSnapshots(({ main, clone }) => {
      if (block.index === currentHeaderIndexCount) {
        main.changeHeaderHashIndex(block.index, block.hash);
      }

      const appsExecuted: ApplicationExecuted[] = [];

      main.setPersistingBlock(block);
      if (block.index > 0) {
        const executed = this.vm.withApplicationEngine<ApplicationExecuted>(
          {
            trigger: TriggerType.System,
            snapshot: 'main',
            gas: 0,
            testMode: true,
          },
          (engine) => {
            engine.loadScript(this.onPersistNativeContractScript);
            const result = engine.execute();
            if (result !== VMState.HALT) {
              throw new PersistNativeContractsError();
            }

            return blockchainUtils.getApplicationExecuted(engine);
          },
        );

        appsExecuted.push(executed);
      }

      main.addBlock(block);
      main.clone();

      const executedTransactions = this.persistTransactions(block, main, clone);
      const finalApplicationsExecuted = appsExecuted.concat(executedTransactions);

      return { changeBatch: main.getChangeSet(), applicationsExecuted: finalApplicationsExecuted };
    });
  }

  // TODO: (not critical) almost all of this logic can be expressed in an observable setup, busy work for later.
  public async getHeaderHashListChanges(
    headerIndex: readonly UInt256[],
    storedCount: number,
  ): Promise<GetHeaderHashListChangesResult> {
    let mutableCount = storedCount;
    // tslint:disable-next-line: no-loop-statement
    while (headerIndex.length - mutableCount >= utils.hashListBatchSize) {
      logger.debug({ name: 'adding new headerHashListChange', currentLength: headerIndex.length, mutableCount });
      await this.caches.headerHashList.add(
        mutableCount,
        new HeaderHashList({
          hashes: headerIndex.slice(mutableCount, mutableCount + utils.hashListBatchSize),
        }),
      );

      mutableCount += utils.hashListBatchSize;
    }

    const changeSet = this.caches.headerHashList.getChangeSet();
    logger.debug({ name: 'headerHashListChange debug', changeSetLength: changeSet.length });
    this.caches.headerHashList.clearChangeSet();

    return {
      storedCount: mutableCount,
      changeSet,
    };
  }

  private persistTransactions(
    block: Block,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
  ): readonly ApplicationExecuted[] {
    return block.transactions.reduce<readonly ApplicationExecuted[]>((acc, transaction) => {
      const appExecuted = this.persistTransaction(transaction, block.index, main, clone);

      return acc.concat(appExecuted);
    }, []);
  }

  private persistTransaction(
    transaction: Transaction,
    index: number,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
  ): ApplicationExecuted {
    clone.addTransaction(transaction, index);
    clone.commit('transactions');

    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.Application,
        container: transaction,
        snapshot: 'clone',
        gas: common.fixed8ToDecimal(transaction.systemFee).toNumber(),
        testMode: false,
      },
      (engine) => {
        engine.loadScript(transaction.script);
        const state = engine.execute();
        if (state === VMState.HALT) {
          clone.deleteTransaction(transaction.hash);
          clone.addTransaction(transaction, index, VMState.HALT);
          clone.commit();
        } else {
          main.clone();
        }

        return blockchainUtils.getApplicationExecuted(engine);
      },
    );
  }
}
