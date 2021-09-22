import { common } from '@neo-one/client-common';
import {
  ApplicationExecuted,
  Block,
  isByteStringStackItem,
  isIntegerStackItem,
  Nep17BalanceKey,
  Nep17Transfer,
  Nep17TransferKey,
} from '@neo-one/node-core';
import { utils } from './utils';

export interface Nep17TransferReturn {
  readonly key: Nep17TransferKey;
  readonly value: Nep17Transfer;
}

export interface Nep17UpdateOptions {
  readonly assetKeys: readonly Nep17BalanceKey[];
  readonly transfersSent: readonly Nep17TransferReturn[];
  readonly transfersReceived: readonly Nep17TransferReturn[];
}

export function getNep17UpdateOptions({
  applicationsExecuted,
  block,
}: {
  readonly applicationsExecuted: readonly ApplicationExecuted[];
  readonly block: Block;
}): Nep17UpdateOptions {
  let transferIndex = 0;
  let blockTransferIndex = block.transactions.length;
  const nep17BalancesChanged = new Set<string>();
  const mutableNep17BalancesChangedKeys: Nep17BalanceKey[] = [];
  const mutableTransfersSent: Nep17TransferReturn[] = [];
  const mutableTransfersReceived: Nep17TransferReturn[] = [];

  applicationsExecuted.forEach((appExecuted) => {
    // We capture FAULT executions as well for debugging purposes
    // if (appExecuted.state === VMState.FAULT) {
    //   return;
    // }

    appExecuted.notifications.forEach((notifyEventArgs) => {
      const { container, scriptHash, eventName, state: stateItems } = notifyEventArgs;

      if (eventName !== 'Transfer') {
        return;
      }
      if (stateItems.length !== 3) {
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
        const fromKey = new Nep17BalanceKey({ userScriptHash: from, assetScriptHash: scriptHash });
        const fromKeyString = fromKey.serializeWire().toString('hex');
        // No need to check address balance for every single transfer. Just need to check new balances for
        // addresses that we know have transferred assets

        // mutableNep17BalancesChangedKeys will be used to run scripts to check storage for new balance of each address
        // whose balance we know has changed based on the transfers we know happened
        if (!nep17BalancesChanged.has(fromKeyString)) {
          nep17BalancesChanged.add(fromKeyString);
          mutableNep17BalancesChangedKeys.push(fromKey);
        }
      }

      if (toBytes !== undefined) {
        to = common.bufferToUInt160(toBytes);
        const toKey = new Nep17BalanceKey({ userScriptHash: to, assetScriptHash: scriptHash });
        const toKeyString = toKey.serializeWire().toString('hex');
        if (!nep17BalancesChanged.has(toKeyString)) {
          nep17BalancesChanged.add(toKeyString);
          mutableNep17BalancesChangedKeys.push(toKey);
        }
      }

      // We want to capture block transactions (ie minting and burning) as well for debugging purposes
      if (utils.isTransaction(container) || container === undefined) {
        const isBlock = container === undefined;
        const amount = amountItem.getInteger();
        const txHash = container === undefined ? block.hash : container.hash;

        if (!from.equals(common.ZERO_UINT160)) {
          mutableTransfersSent.push({
            key: new Nep17TransferKey({
              userScriptHash: from,
              timestampMS: block.header.timestamp,
              assetScriptHash: scriptHash,
              blockTransferNotificationIndex: isBlock ? blockTransferIndex : transferIndex,
            }),
            value: new Nep17Transfer({
              userScriptHash: to,
              txHash,
              blockIndex: block.index,
              amountBuffer: amount.toBuffer(),
              source: isBlock ? 'Block' : 'Transaction',
              state: appExecuted.state,
            }),
          });
        }

        if (!to.equals(common.ZERO_UINT160)) {
          mutableTransfersReceived.push({
            key: new Nep17TransferKey({
              userScriptHash: to,
              timestampMS: block.header.timestamp,
              assetScriptHash: scriptHash,
              blockTransferNotificationIndex: isBlock ? blockTransferIndex : transferIndex,
            }),
            value: new Nep17Transfer({
              userScriptHash: from,
              txHash,
              blockIndex: block.index,
              amountBuffer: amount.toBuffer(),
              source: isBlock ? 'Block' : 'Transaction',
              state: appExecuted.state,
            }),
          });
        }

        if (isBlock) {
          blockTransferIndex += 1;
        } else {
          transferIndex += 1;
        }
      }
    });
  });

  return {
    assetKeys: mutableNep17BalancesChangedKeys,
    transfersSent: mutableTransfersSent,
    transfersReceived: mutableTransfersReceived,
  };
}
