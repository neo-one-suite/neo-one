import { SourceMaps } from '@neo-one/client';
import { CallReceiptJSON, convertCallReceipt, RawCallReceipt } from '@neo-one/client-core';
import {
  disableConsoleLogForTest,
  enableConsoleLogForTest,
  processActionsAndMessage,
  processConsoleLogMessages,
} from '@neo-one/client-switch';

export const checkResult = async (receiptIn: CallReceiptJSON, sourceMaps: SourceMaps, checkStack = false) => {
  const receipt = convertCallReceipt(receiptIn);

  return checkRawResult(receipt, sourceMaps, checkStack);
};

export const checkRawResult = async (receipt: RawCallReceipt, sourceMaps: SourceMaps, checkStack = false) => {
  if (checkStack && receipt.result.stack.length !== 0) {
    throw new Error(`Found leftover stack items, length: ${receipt.result.stack.length}`);
  }

  if (receipt.result.state === 'FAULT') {
    enableConsoleLogForTest();
    try {
      const message = await processActionsAndMessage({
        actions: receipt.actions,
        message: receipt.result.message,
        sourceMaps: Promise.resolve(sourceMaps),
      });

      throw new Error(message);
    } finally {
      disableConsoleLogForTest();
    }
  }

  await processConsoleLogMessages({
    actions: receipt.actions,
    sourceMaps: Promise.resolve(sourceMaps),
  });
};
