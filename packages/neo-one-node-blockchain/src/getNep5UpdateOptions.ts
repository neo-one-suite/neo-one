import { common, VMState } from '@neo-one/client-common';
import {
  ApplicationExecuted,
  Block,
  isByteStringStackItem,
  isIntegerStackItem,
  Nep5BalanceKey,
  Nep5Transfer,
  Nep5TransferKey,
} from '@neo-one/node-core';
import { utils } from './utils';

export interface Nep5TransferReturn {
  readonly key: Nep5TransferKey;
  readonly value: Nep5Transfer;
}

export interface Nep5UpdateOptions {
  readonly assetKeys: readonly Nep5BalanceKey[];
  readonly transfersSent: readonly Nep5TransferReturn[];
  readonly transfersReceived: readonly Nep5TransferReturn[];
}

export function getNep5UpdateOptions({
  applicationsExecuted,
  block,
}: {
  readonly applicationsExecuted: readonly ApplicationExecuted[];
  readonly block: Block;
}): Nep5UpdateOptions {
  let transferIndex = 0;
  const nep5BalancesChanged = new Set<string>();
  const mutableNep5BalancesChangedKeys: Nep5BalanceKey[] = [];
  const mutableTransfersSent: Nep5TransferReturn[] = [];
  const mutableTransfersReceived: Nep5TransferReturn[] = [];

  applicationsExecuted.forEach((appExecuted) => {
    if (appExecuted.state === VMState.FAULT) {
      return;
    }

    appExecuted.notifications.forEach((notifyEventArgs) => {
      const { container, scriptHash, eventName, state: stateItems } = notifyEventArgs;

      if (stateItems.length === 0) {
        return;
      }
      if (eventName !== 'Transfer') {
        return;
      }
      if (stateItems.length < 3) {
        return;
      }
      if (!stateItems[0].isNull && !isByteStringStackItem(stateItems[0])) {
        return;
      }
      if (!stateItems[1].isNull && !isByteStringStackItem(stateItems[1])) {
        return;
      }
      const amountItem = stateItems[2];
      if (!(isByteStringStackItem(amountItem) || isIntegerStackItem(amountItem))) {
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
        // addresses that we know have transferred assets

        // mutableNep5BalancesChangedKeys will be used to run scripts to check storage for new balance of each address
        // whose balance we know has changed based on the transfers we know happened
        if (!nep5BalancesChanged.has(fromKeyString)) {
          nep5BalancesChanged.add(fromKeyString);
          mutableNep5BalancesChangedKeys.push(fromKey);
        }
      }

      if (toBytes !== undefined) {
        to = common.bufferToUInt160(toBytes);
        const toKey = new Nep5BalanceKey({ userScriptHash: to, assetScriptHash: scriptHash });
        const toKeyString = toKey.serializeWire().toString('hex');
        if (!nep5BalancesChanged.has(toKeyString)) {
          nep5BalancesChanged.add(toKeyString);
          mutableNep5BalancesChangedKeys.push(toKey);
        }
      }

      if (utils.isTransaction(container)) {
        const amount = amountItem.getInteger();
        const txHash = container.hash;

        if (!from.equals(common.ZERO_UINT160)) {
          mutableTransfersSent.push({
            key: new Nep5TransferKey({
              userScriptHash: from,
              timestampMS: block.timestamp,
              assetScriptHash: scriptHash,
              blockTransferNotificationIndex: transferIndex,
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
              blockTransferNotificationIndex: transferIndex,
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

  return {
    assetKeys: mutableNep5BalancesChangedKeys,
    transfersSent: mutableTransfersSent,
    transfersReceived: mutableTransfersReceived,
  };
}
