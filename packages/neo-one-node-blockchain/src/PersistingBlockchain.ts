// tslint:disable no-array-mutation no-object-mutation
import { TriggerType, VMState } from '@neo-one/client-common';
import {
  ApplicationExecuted,
  Batch,
  Block,
  SnapshotHandler,
  Transaction,
  VM,
  VMProtocolSettingsIn,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { PersistNativeContractsError, PostPersistError } from './errors';
import { utils } from './utils';

interface PersistingBlockchainOptions {
  readonly vm: VM;
  readonly onPersistNativeContractScript: Buffer;
  readonly postPersistNativeContractScript: Buffer;
  readonly protocolSettings: VMProtocolSettingsIn;
}

export class PersistingBlockchain {
  private readonly vm: VM;
  private readonly onPersistNativeContractScript: Buffer;
  private readonly postPersistNativeContractScript: Buffer;
  private readonly protocolSettings: VMProtocolSettingsIn;

  public constructor({
    vm,
    onPersistNativeContractScript,
    postPersistNativeContractScript,
    protocolSettings,
  }: PersistingBlockchainOptions) {
    this.vm = vm;
    this.onPersistNativeContractScript = onPersistNativeContractScript;
    this.postPersistNativeContractScript = postPersistNativeContractScript;
    this.protocolSettings = protocolSettings;
  }

  public persistBlock(
    block: Block,
    // tslint:disable-next-line: readonly-array
  ): { readonly changeBatch: Batch[]; readonly applicationsExecuted: readonly ApplicationExecuted[] } {
    return this.vm.withSnapshots(({ main, clone }) => {
      const appsExecuted: ApplicationExecuted[] = [];

      const executed = this.vm.withApplicationEngine<ApplicationExecuted>(
        {
          trigger: TriggerType.OnPersist,
          snapshot: 'main',
          gas: new BN(0),
          persistingBlock: block,
          settings: this.protocolSettings,
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

      main.clone();

      const executedTransactions = this.persistTransactions(block, main, clone);

      const postPersistExecuted = this.postPersist(block);

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
      const appExecuted = this.persistTransaction(transaction, main, clone, block);

      return acc.concat(appExecuted);
    }, []);
  }

  private persistTransaction(
    transaction: Transaction,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
    block: Block,
  ): ApplicationExecuted {
    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.Application,
        container: transaction,
        snapshot: 'clone',
        gas: transaction.systemFee,
        persistingBlock: block,
        settings: this.protocolSettings,
      },
      (engine) => {
        engine.loadScript({ script: transaction.script });
        const state = engine.execute();
        if (state === VMState.HALT) {
          clone.commit();
        } else {
          main.clone();
        }

        return utils.getApplicationExecuted(engine, transaction);
      },
    );
  }

  private postPersist(block: Block): ApplicationExecuted {
    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.PostPersist,
        container: undefined,
        gas: new BN(0),
        snapshot: 'main',
        persistingBlock: block,
        settings: this.protocolSettings,
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
