// tslint:disable no-array-mutation no-object-mutation
import { common, UInt256, VMState } from '@neo-one/client-common';
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
} from '@neo-one/csharp-core';
import { ReadAddStorageCache } from './StorageCache';
import { utils, utils as blockchainUtils } from './utils';

interface PersistingBlockchainOptions {
  readonly vm: VM;
  readonly storage: Storage;
  readonly onPersistNativeContractScript: Buffer;
}

interface GetHeaderHashListChangesResult {
  readonly countIncrement: number;
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
  ): { readonly changeSet: readonly any[]; readonly applicationsExecuted: readonly ApplicationExecuted[] } {
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
            if (result !== 'HALT') {
              // TODO: Implement a real error;
              throw new Error('Failed to persist native contract changes');
            }

            return blockchainUtils.getApplicationExecuted(engine);
          },
        );

        appsExecuted.push(executed);
      }

      main.addBlock(block);
      main.clone();

      const { changeSet: transactionsChangeSet, executed: executedTransactions } = this.persistTransactions(
        block,
        main,
        clone,
      );

      main.changeBlockHashIndex(block.index, block.hash);
      const finalChangeSet = new Set([...transactionsChangeSet, ...main.getChangeSet()]);
      const finalApplicationsExecuted = appsExecuted.concat(executedTransactions);

      return { changeSet: [...finalChangeSet], applicationsExecuted: finalApplicationsExecuted };
    });
  }

  // TODO: (not critical) almost all of this logic can be expressed in an observable setup, busy work for later.
  public async getHeaderHashListChanges(
    headerIndex: readonly UInt256[],
    storedCount: number,
  ): Promise<GetHeaderHashListChangesResult> {
    let increment = 0;
    // tslint:disable-next-line: no-loop-statement
    while (headerIndex.length - (storedCount + increment) >= utils.hashListBatchSize) {
      const index = storedCount + increment;
      await this.caches.headerHashList.add(
        index,
        new HeaderHashList({
          hashes: headerIndex.slice(index, index + utils.hashListBatchSize),
        }),
      );

      increment += utils.hashListBatchSize;
    }

    return {
      countIncrement: increment,
      changeSet: this.caches.headerHashList.getChangeSet(),
    };
  }

  private persistTransactions(
    block: Block,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
  ): { readonly changeSet: readonly any[]; readonly executed: readonly ApplicationExecuted[] } {
    return block.transactions.reduce<{
      readonly changeSet: any[];
      readonly executed: readonly ApplicationExecuted[];
    }>(
      (acc, transaction) => {
        const { changeSet: nextChangeSet, appExecuted } = this.persistTransaction(
          transaction,
          block.index,
          main,
          clone,
        );

        return {
          changeSet: acc.changeSet.concat(nextChangeSet),
          executed: acc.executed.concat(appExecuted),
        };
      },
      { changeSet: [], executed: [] },
    );
  }

  private persistTransaction(
    transaction: Transaction,
    index: number,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
  ): { readonly appExecuted: ApplicationExecuted; readonly changeSet: readonly any[] } {
    clone.addTransaction(transaction, index);
    let changeSet = clone.getChangeSet();
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
        if (state === 'HALT') {
          clone.deleteTransaction(transaction.hash);
          clone.addTransaction(transaction, index, VMState.HALT);
          changeSet = changeSet.concat(clone.getChangeSet());
          clone.commit();
        } else {
          main.clone();
        }

        return {
          changeSet,
          appExecuted: blockchainUtils.getApplicationExecuted(engine),
        };
      },
    );
  }
}
