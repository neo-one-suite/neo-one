// tslint:disable no-array-mutation no-object-mutation
import { TriggerType, VMState } from '@neo-one/client-common';
import { ApplicationExecuted, Block, SnapshotHandler, Transaction, VM } from '@neo-one/node-core';
import { PersistNativeContractsError } from './errors';
import { utils, utils as blockchainUtils } from './utils';

interface PersistingBlockchainOptions {
  readonly vm: VM;
  readonly onPersistNativeContractScript: Buffer;
}

export class PersistingBlockchain {
  private readonly vm: VM;
  private readonly onPersistNativeContractScript: Buffer;

  public constructor(options: PersistingBlockchainOptions) {
    this.vm = options.vm;
    this.onPersistNativeContractScript = options.onPersistNativeContractScript;
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
            gas: utils.ZERO,
          },
          (engine) => {
            engine.loadScript({ script: this.onPersistNativeContractScript });
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

      return { changeBatch: main.getChangeSet(), applicationsExecuted: appsExecuted.concat(executedTransactions) };
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

        return blockchainUtils.getApplicationExecuted(engine, transaction);
      },
    );
  }
}
