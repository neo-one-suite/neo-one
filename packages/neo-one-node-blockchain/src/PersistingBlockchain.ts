// tslint:disable no-array-mutation no-object-mutation
import { common, TriggerType, VMState } from '@neo-one/client-common';
import { ApplicationExecuted, Block, SnapshotHandler, Transaction, VM } from '@neo-one/node-core';
import { PersistNativeContractsError, PostPersistError } from './errors';
import { utils } from './utils';

interface PersistingBlockchainOptions {
  readonly vm: VM;
  readonly onPersistNativeContractScript: Buffer;
  readonly postPersistNativeContractScript: Buffer;
}

export class PersistingBlockchain {
  private readonly vm: VM;
  private readonly onPersistNativeContractScript: Buffer;
  private readonly postPersistNativeContractScript: Buffer;

  public constructor(options: PersistingBlockchainOptions) {
    this.vm = options.vm;
    this.onPersistNativeContractScript = options.onPersistNativeContractScript;
    this.postPersistNativeContractScript = options.postPersistNativeContractScript;
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
      const executed = this.vm.withApplicationEngine<ApplicationExecuted>(
        {
          trigger: TriggerType.OnPersist,
          snapshot: 'main',
          gas: common.TWENTY_FIXED8,
        },
        (engine) => {
          engine.loadScript({ script: this.onPersistNativeContractScript });
          const result = engine.execute();
          if (result !== VMState.HALT) {
            throw new PersistNativeContractsError();
          }

          return utils.getApplicationExecuted(engine);
        },
      );

      appsExecuted.push(executed);

      main.addBlock(block);
      main.clone();

      const executedTransactions = this.persistTransactions(block, main, clone);

      main.changeBlockHashIndex(block.index, block.hash);

      const postPersistExecuted = this.postPersist();

      return {
        changeBatch: main.getChangeSet(),
        applicationsExecuted: appsExecuted.concat(executedTransactions).concat(postPersistExecuted),
      };
    });
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
        gas: transaction.systemFee,
      },
      (engine) => {
        engine.loadScript({ script: transaction.script });
        const state = engine.execute();
        if (state === VMState.HALT) {
          clone.deleteTransaction(transaction.hash);
          clone.addTransaction(transaction, index, VMState.HALT);
          clone.commit();
        } else {
          main.clone();
        }

        return utils.getApplicationExecuted(engine, transaction);
      },
    );
  }

  private postPersist(): ApplicationExecuted {
    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.PostPersist,
        container: undefined,
        gas: common.TWENTY_FIXED8,
        snapshot: 'main',
      },
      (engine) => {
        engine.loadScript({ script: this.postPersistNativeContractScript });
        const result = engine.execute();
        if (result !== VMState.HALT) {
          throw new PostPersistError();
        }

        return utils.getApplicationExecuted(engine);
      },
    );
  }
}
