import { common, ScriptBuilder, VMState } from '@neo-one/client-common';
import {
  ApplicationExecuted,
  Block,
  BlockchainSettings,
  CallReceipt,
  ChangeSet,
  Nep5Balance,
  Nep5BalanceKey,
  Nep5Transfer,
  Nep5TransferKey,
  RunEngineOptions,
  StackItemType,
  Transaction,
} from '@neo-one/node-core';
import { BN } from 'bn.js';

export function getNep5ChangeSet({
  applicationsExecuted,
  block,
  settings,
  runEngineWrapper,
}: {
  readonly applicationsExecuted: readonly ApplicationExecuted[];
  readonly block: Block;
  readonly settings: BlockchainSettings;
  readonly runEngineWrapper: (options: RunEngineOptions) => CallReceipt;
}): ChangeSet {
  let transferIndex = 0;
  const nep5BalancesChanged = new Set<string>();
  const mutableNep5BalancesChangedKeys: Nep5BalanceKey[] = [];
  const mutableTransfersSent: Array<{ readonly key: Nep5TransferKey; readonly value: Nep5Transfer }> = [];
  const mutableTransfersReceived: Array<{ readonly key: Nep5TransferKey; readonly value: Nep5Transfer }> = [];

  applicationsExecuted.forEach((appExecuted) => {
    if (appExecuted.state === VMState.FAULT) {
      return;
    }

    appExecuted.notifications.forEach((notifyEventArgs) => {
      const { scriptContainer, scriptHash, eventName, state: stateItems } = notifyEventArgs;

      if (stateItems.length === 0) {
        return;
      }
      if (eventName !== 'Transfer') {
        return;
      }
      if (stateItems.length < 3) {
        return;
      }
      if (!stateItems[0].isNull && stateItems[0].type !== StackItemType.ByteString) {
        return;
      }
      if (!stateItems[1].isNull && stateItems[1].type !== StackItemType.ByteString) {
        return;
      }
      const amountItem = stateItems[2];
      if (!(amountItem.type === StackItemType.ByteString || amountItem.type === StackItemType.Integer)) {
        return;
      }
      const fromBytes = stateItems[0].isNull ? undefined : stateItems[0].getBuffer();
      if (fromBytes !== undefined && fromBytes.length !== common.UINT160_BUFFER_BYTES) {
        return;
      }
      const toBytes = stateItems[1].isNull ? undefined : stateItems[1].getBuffer();
      if (toBytes !== undefined && toBytes.length !== common.UINT160_BUFFER_BYTES) {
        return;
      }
      if (fromBytes === undefined && toBytes === undefined) {
        return;
      }
      let from = common.ZERO_UINT160;
      let to = common.ZERO_UINT160;

      if (fromBytes !== undefined) {
        from = common.bufferToUInt160(fromBytes);
        const fromKey = new Nep5BalanceKey({ userScriptHash: from, assetScriptHash: scriptHash });
        const fromKeyString = fromKey.serializeWire().toString('hex');
        // No need to check address balance for every single transfer. Just need to check new balances for
        // addresses that we know have transfered assets

        // mutableNep5BalancesChangedKeys will be used to run scripts to check storage for new balance of each address
        // whose balance we know has changed based on the transfers we know happened
        if (!nep5BalancesChanged.has(fromKeyString)) {
          nep5BalancesChanged.add(fromKeyString);
          mutableNep5BalancesChangedKeys.push(fromKey);
        }
      }

      if (toBytes !== undefined) {
        to = common.bufferToUInt160(toBytes);
        const toKey = new Nep5BalanceKey({ userScriptHash: from, assetScriptHash: scriptHash });
        const toKeyString = toKey.serializeWire().toString('hex');
        if (!nep5BalancesChanged.has(toKeyString)) {
          nep5BalancesChanged.add(toKeyString);
          mutableNep5BalancesChangedKeys.push(toKey);
        }
      }

      if (scriptContainer.type === 'Transaction') {
        const amount = amountItem.getInteger();
        const txHash = Transaction.deserializeWire({
          buffer: scriptContainer.buffer,
          context: { messageMagic: settings.messageMagic },
        }).hash;

        if (!from.equals(common.ZERO_UINT160)) {
          mutableTransfersSent.push({
            key: new Nep5TransferKey({
              userScriptHash: from,
              timestampMS: block.timestamp,
              assetScriptHash: scriptHash,
              blockXferNotificationIndex: transferIndex,
            }),
            value: new Nep5Transfer({
              userScriptHash: to,
              txHash,
              blockIndex: block.index,
              amountBuffer: amount.toBuffer(),
            }),
          });
        }

        if (!to.equals(common.ZERO_UINT160)) {
          mutableTransfersReceived.push({
            key: new Nep5TransferKey({
              userScriptHash: to,
              timestampMS: block.timestamp,
              assetScriptHash: scriptHash,
              blockXferNotificationIndex: transferIndex,
            }),
            value: new Nep5Transfer({
              userScriptHash: from,
              txHash,
              blockIndex: block.index,
              amountBuffer: amount.toBuffer(),
            }),
          });
        }

        transferIndex += 1;
      }
    });
  });

  const nep5BalancePairs = mutableNep5BalancesChangedKeys.map((key) => {
    const script = new ScriptBuilder().emitAppCall(key.assetScriptHash, 'balanceOf', key.userScriptHash).build();
    const callReceipt = runEngineWrapper({ script, gas: 100000000, snapshot: 'main' });
    const balanceBuffer = callReceipt.stack[0].getInteger().toBuffer();

    return { key, value: new Nep5Balance({ balanceBuffer, lastUpdatedBlock: block.index }) };
  });

  const nep5BalanceChangeSet: ChangeSet = nep5BalancePairs.map(({ key, value }) => {
    if (value.balance.eqn(0)) {
      return {
        type: 'delete',
        change: {
          type: 'nep5Balance',
          key,
        },
      };
    }

    return {
      type: 'add',
      change: {
        type: 'nep5Balance',
        key,
        value,
      },
      subType: 'update',
    };
  });
  const nep5TransfersSentChangeSet: ChangeSet = mutableTransfersSent.map(({ key, value }) => ({
    type: 'add',
    subType: 'add',
    change: {
      type: 'nep5TransferSent',
      key,
      value,
    },
  }));
  const nep5TransfersReceivedChangeSet: ChangeSet = mutableTransfersReceived.map(({ key, value }) => ({
    type: 'add',
    subType: 'add',
    change: {
      type: 'nep5TransferReceived',
      key,
      value,
    },
  }));

  return nep5BalanceChangeSet.concat(nep5TransfersReceivedChangeSet, nep5TransfersSentChangeSet);
}
