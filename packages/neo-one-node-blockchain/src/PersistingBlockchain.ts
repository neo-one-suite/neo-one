// tslint:disable no-array-mutation no-object-mutation
import { common, TriggerType, UInt160, VMState } from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Action,
  ApplicationExecuted,
  assertByteStringStackItem,
  Batch,
  Block,
  LogAction,
  Notification,
  NotificationAction,
  SnapshotHandler,
  StackItem,
  stackItemToJSON,
  Transaction,
  TransactionData,
  VM,
  VMProtocolSettingsIn,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { PersistNativeContractsError, PostPersistError } from './errors';
import { getExecutionResult } from './getExecutionResult';
import { utils } from './utils';

const logger = createChild(nodeLogger, { service: 'persisting-blockchain' });

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
    lastGlobalActionIndexIn: BN,
    lastGlobalTransactionIndex: BN,
  ): {
    // tslint:disable-next-line: readonly-array
    readonly changeBatch: Batch[];
    readonly transactionData: readonly TransactionData[];
    readonly applicationsExecuted: readonly ApplicationExecuted[];
    readonly actions: readonly Action[];
    readonly lastGlobalActionIndex: BN;
  } {
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

      const { actions: onPersistActions, lastGlobalActionIndex: lastGlobalActionIndexOnPersist } =
        this.getActionsFromAppExecuted(executed, lastGlobalActionIndexIn.add(utils.ONE));

      const {
        transactionData,
        executedTransactions,
        actions: txActions,
        lastGlobalActionIndex: lastGlobalActionIndexTxs,
      } = this.persistTransactions(block, main, clone, lastGlobalActionIndexOnPersist, lastGlobalTransactionIndex);

      const postPersistExecuted = this.postPersist(block);
      const { actions: blockActions, lastGlobalActionIndex } = this.getActionsFromAppExecuted(
        postPersistExecuted,
        lastGlobalActionIndexTxs,
      );

      return {
        changeBatch: main.getChangeSet(),
        transactionData,
        actions: onPersistActions.concat(txActions, blockActions),
        lastGlobalActionIndex: lastGlobalActionIndex.sub(utils.ONE),
        applicationsExecuted: appsExecuted.concat(executedTransactions).concat(postPersistExecuted),
      };
    });
  }

  private getActionsFromAppExecuted(
    appExecuted: ApplicationExecuted,
    lastGlobalActionIndexIn: BN,
  ): { readonly actions: readonly Action[]; readonly lastGlobalActionIndex: BN } {
    let lastGlobalActionIndex = lastGlobalActionIndexIn;
    const actions: Action[] = [];

    appExecuted.notifications.forEach((notification) => {
      actions.push(
        new NotificationAction({
          index: lastGlobalActionIndexIn,
          scriptHash: notification.scriptHash,
          eventName: notification.eventName,
          args: notification.state.map((n) => n.toContractParameter()),
        }),
      );

      lastGlobalActionIndex = lastGlobalActionIndex.add(utils.ONE);
    });
    appExecuted.logs.forEach((log) => {
      actions.push(
        new LogAction({
          index: lastGlobalActionIndexIn,
          scriptHash: log.callingScriptHash,
          message: log.message,
          position: log.position,
        }),
      );

      lastGlobalActionIndex = lastGlobalActionIndex.add(utils.ONE);
    });

    return { actions, lastGlobalActionIndex };
  }

  private getContractManagementInfo(
    appExecuted: ApplicationExecuted,
    block: Block,
  ): {
    readonly deletedContractHashes: readonly UInt160[];
    readonly deployedContractHashes: readonly UInt160[];
    readonly updatedContractHashes: readonly UInt160[];
  } {
    const contractManagementNotifications = appExecuted.notifications.filter((n) =>
      n.scriptHash.equals(common.nativeHashes.ContractManagement),
    );
    const getUInt160 = (item: StackItem) => common.bufferToUInt160(assertByteStringStackItem(item).getBuffer());
    const mapFilterUInt160s = (notifications: readonly Notification[], eventName: string) =>
      notifications
        .filter((n) => n.eventName === eventName)
        .filter((n) => {
          try {
            getUInt160(n.state[0]);
          } catch (error) {
            logger.error({
              name: 'contract_management_info_parse_error',
              index: block.index,
              event: eventName,
              // tslint:disable-next-line: no-unnecessary-callback-wrapper
              state: n.state.map((item) => stackItemToJSON(item)),
              error,
            });

            return false;
          }

          return true;
        })
        .map((n) => {
          const hash = getUInt160(n.state[0]);
          logger.info({
            name: 'new_contract_management_action',
            index: block.index,
            event: eventName,
            hash: common.uInt160ToString(hash),
          });

          return hash;
        });

    const updatedContractHashes = mapFilterUInt160s(contractManagementNotifications, 'Update');
    const deletedContractHashes = mapFilterUInt160s(contractManagementNotifications, 'Destroy');
    const deployedContractHashes = mapFilterUInt160s(contractManagementNotifications, 'Deploy');

    return { deletedContractHashes, deployedContractHashes, updatedContractHashes };
  }

  private persistTransactions(
    block: Block,
    main: SnapshotHandler,
    clone: Omit<SnapshotHandler, 'clone'>,
    lastGlobalActionIndexIn: BN,
    lastGlobalTransactionIndex: BN,
  ): {
    readonly transactionData: readonly TransactionData[];
    readonly executedTransactions: readonly ApplicationExecuted[];
    readonly lastGlobalActionIndex: BN;
    readonly actions: readonly Action[];
  } {
    return block.transactions.reduce<{
      readonly transactionData: readonly TransactionData[];
      readonly executedTransactions: readonly ApplicationExecuted[];
      readonly actions: readonly Action[];
      readonly lastGlobalActionIndex: BN;
    }>(
      (acc, transaction, transactionIndex) => {
        const appExecuted = this.persistTransaction(transaction, main, clone, block);
        const { actions: newActions, lastGlobalActionIndex } = this.getActionsFromAppExecuted(
          appExecuted,
          lastGlobalActionIndexIn,
        );

        const executionResult = getExecutionResult(appExecuted);

        const { deletedContractHashes, deployedContractHashes, updatedContractHashes } = this.getContractManagementInfo(
          appExecuted,
          block,
        );

        const txData = new TransactionData({
          hash: transaction.hash,
          blockHash: block.hash,
          deletedContractHashes,
          deployedContractHashes,
          updatedContractHashes,
          executionResult,
          actionIndexStart: lastGlobalActionIndexIn,
          actionIndexStop: lastGlobalActionIndex,
          transactionIndex,
          blockIndex: block.index,
          globalIndex: lastGlobalTransactionIndex.add(new BN(transactionIndex + 1)),
        });

        return {
          transactionData: acc.transactionData.concat(txData),
          executedTransactions: acc.executedTransactions.concat(appExecuted),
          actions: acc.actions.concat(newActions),
          lastGlobalActionIndex,
        };
      },
      { transactionData: [], executedTransactions: [], actions: [], lastGlobalActionIndex: lastGlobalActionIndexIn },
    );
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
