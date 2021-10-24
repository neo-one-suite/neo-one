// tslint:disable no-array-mutation no-object-mutation
import { common, TriggerType, UInt160, VMState } from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Action,
  ActionSource,
  ActionType,
  ApplicationExecuted,
  assertByteStringStackItem,
  Batch,
  Block,
  BlockAccountPolicyChange,
  ContractParameter,
  ExecFeeFactorPolicyChange,
  FeePerBytePolicyChange,
  GasPerBlockPolicyChange,
  LogAction,
  MinimumDeploymentFeePolicyChange,
  Notification,
  NotificationAction,
  RegisterCandidatePolicyChange,
  RegisterPricePolicyChange,
  RoleDesignationPolicyChange,
  SnapshotHandler,
  StackItem,
  stackItemToJSON,
  StoragePricePolicyChange,
  Transaction,
  TransactionData,
  UnblockAccountPolicyChange,
  UnregisterCandidatePolicyChange,
  VM,
  VMProtocolSettingsIn,
  Vote,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
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
    readonly blockActionsCount: number;
  } {
    return this.vm.withSnapshots(({ main, clone }) => {
      const onPersistExecuted = this.vm.withApplicationEngine<ApplicationExecuted>(
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
            throw new PersistNativeContractsError(engine.faultException);
          }

          return utils.getApplicationExecuted(engine);
        },
      );

      main.clone();

      const {
        transactionData,
        executedTransactions,
        actions: txActions,
        lastGlobalActionIndex: lastGlobalActionIndexTxs,
      } = this.persistTransactions(
        block,
        main,
        clone,
        lastGlobalActionIndexIn.add(utils.ONE),
        lastGlobalTransactionIndex,
      );

      const postPersistExecuted = this.postPersist(block);

      const { actions: onPersistActions, lastGlobalActionIndex: lastGlobalActionIndexOnPersist } =
        this.getActionsFromAppExecuted(onPersistExecuted, lastGlobalActionIndexTxs, ActionSource.Block);
      const { actions: postPersistActions, lastGlobalActionIndex } = this.getActionsFromAppExecuted(
        postPersistExecuted,
        lastGlobalActionIndexOnPersist,
        ActionSource.Block,
      );

      return {
        changeBatch: main.getChangeSet(),
        transactionData,
        blockActionsCount: onPersistActions.length + postPersistActions.length,
        actions: txActions.concat(onPersistActions, postPersistActions),
        lastGlobalActionIndex: lastGlobalActionIndex.sub(utils.ONE),
        applicationsExecuted: executedTransactions.concat(onPersistExecuted).concat(postPersistExecuted),
      };
    });
  }

  private getActionsFromAppExecuted(
    appExecuted: ApplicationExecuted,
    lastGlobalActionIndexIn: BN,
    source: ActionSource,
  ): { readonly actions: readonly Action[]; readonly lastGlobalActionIndex: BN } {
    let lastGlobalActionIndex = lastGlobalActionIndexIn;
    const actions: Action[] = [];

    appExecuted.notifications.forEach((notification) => {
      actions.push(
        new NotificationAction({
          source,
          index: lastGlobalActionIndex,
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
          source,
          index: lastGlobalActionIndex,
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
          logger.debug({
            title: 'new_contract_management_action',
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

  private getVotes(actions: readonly Action[]) {
    return actions
      .filter((a): a is NotificationAction => a.type === ActionType.Notification)
      .filter((n) => n.eventName === 'Vote' && common.uInt160Equal(n.scriptHash, common.nativeHashes.NEO))
      .map((n) => {
        const vote = new Vote({
          account: common.bufferToUInt160(n.args[0].asBuffer()),
          voteTo: n.args[1].isNull ? common.ECPOINT_INFINITY : common.bufferToECPoint(n.args[1].asBuffer()),
          balance: n.args[2].asInteger(),
          index: n.index,
        });
        logger.debug({ title: 'new_vote', ...vote.serializeJSON() });

        return vote;
      });
  }

  private getPolicyChanges(actions: readonly Action[]) {
    const getECPoint = (item: ContractParameter) => common.bufferToECPoint(item.asBuffer());
    const getUInt160 = (item: ContractParameter) => common.bufferToUInt160(item.asBuffer());
    const getBN = (item: ContractParameter) => item.asInteger();

    return actions
      .filter((n): n is NotificationAction => n.type === ActionType.Notification)
      .filter(
        (n) =>
          common.uInt160Equal(n.scriptHash, common.nativeHashes.NEO) ||
          common.uInt160Equal(n.scriptHash, common.nativeHashes.RoleManagement) ||
          common.uInt160Equal(n.scriptHash, common.nativeHashes.Policy) ||
          common.uInt160Equal(n.scriptHash, common.nativeHashes.ContractManagement),
      )
      .map((n) => {
        const val = n.args[0];
        const index = n.index;
        let result;
        switch (n.eventName) {
          case 'GasPerBlock':
            result = new GasPerBlockPolicyChange({ value: getBN(val), index });
            break;
          case 'RegisterPrice':
            result = new RegisterPricePolicyChange({ value: getBN(val), index });
            break;
          case 'UnregisterCandidate':
            result = new UnregisterCandidatePolicyChange({ value: getECPoint(val), index });
            break;
          case 'RegisterCandidate':
            result = new RegisterCandidatePolicyChange({ value: getECPoint(val), index });
            break;
          case 'Designation':
            result = new RoleDesignationPolicyChange({ value: getBN(val).toNumber(), index });
            break;
          case 'FeePerByte':
            result = new FeePerBytePolicyChange({ value: getBN(val), index });
            break;
          case 'ExecFeeFactor':
            result = new ExecFeeFactorPolicyChange({ value: getBN(val).toNumber(), index });
            break;
          case 'StoragePrice':
            result = new StoragePricePolicyChange({ value: getBN(val).toNumber(), index });
            break;
          case 'BlockAccount':
            result = new BlockAccountPolicyChange({ value: getUInt160(val), index });
            break;
          case 'UnblockAccount':
            result = new UnblockAccountPolicyChange({ value: getUInt160(val), index });
            break;
          case 'MinimumDeploymentFee':
            result = new MinimumDeploymentFeePolicyChange({ value: getBN(val), index });
            break;
          default:
            result = undefined;
        }
        if (result !== undefined) {
          logger.debug({ title: 'new_policy_change', ...result.serializeJSON() });
        }

        return result;
      })
      .filter(commonUtils.notNull);
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
          acc.lastGlobalActionIndex,
          ActionSource.Transaction,
        );

        const executionResult = getExecutionResult(appExecuted);

        const { deletedContractHashes, deployedContractHashes, updatedContractHashes } = this.getContractManagementInfo(
          appExecuted,
          block,
        );
        const votes = this.getVotes(newActions);
        const policyChanges = this.getPolicyChanges(newActions);

        const txData = new TransactionData({
          votes,
          policyChanges,
          hash: transaction.hash,
          blockHash: block.hash,
          deletedContractHashes,
          deployedContractHashes,
          updatedContractHashes,
          executionResult,
          actionIndexStart: acc.lastGlobalActionIndex,
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
          throw new PostPersistError(engine.faultException);
        }

        return utils.getApplicationExecuted(engine);
      },
    );
  }
}
