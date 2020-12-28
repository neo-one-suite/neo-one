import { CallReceiptJSON, RawCallReceipt, SourceMaps } from '@neo-one/client-common';
import { convertCallReceipt } from '@neo-one/client-core';
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
  if (receipt.state === 'FAULT') {
    enableConsoleLogForTest();
    try {
      // TODO: reimplement this message processing
      // const message = await processActionsAndMessage({
      //   actions: receipt.actions,
      //   message: receipt.message,
      //   sourceMaps,
      // });

      throw new Error(receipt.stack as string);
    } finally {
      disableConsoleLogForTest();
    }
  }

  // TODO: reimplement this log processing
  // await processConsoleLogMessages({
  //   actions: receipt.actions,
  //   sourceMaps,
  // });

  if (checkStack && receipt.stack.length !== 0) {
    throw new Error(`Found leftover stack items, length: ${receipt.stack.length}`);
  }
};
