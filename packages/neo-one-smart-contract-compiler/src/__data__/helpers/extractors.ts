import { SourceMaps } from '@neo-one/client';
import { CallReceiptJSON, convertCallReceipt, RawCallReceipt } from '@neo-one/client-core';
import { processActionsAndMessage, processConsoleLogMessages } from '@neo-one/client-switch';

export const checkResult = async (receiptIn: CallReceiptJSON, sourceMaps: SourceMaps) => {
  const receipt = convertCallReceipt(receiptIn);

  return checkRawResult(receipt, sourceMaps);
};

export const checkRawResult = async (receipt: RawCallReceipt, sourceMaps: SourceMaps) => {
  if (receipt.result.state === 'FAULT') {
    const message = await processActionsAndMessage({
      actions: receipt.actions,
      message: receipt.result.message,
      sourceMaps: Promise.resolve(sourceMaps),
    });

    throw new Error(message);
  }

  await processConsoleLogMessages({
    actions: receipt.actions,
    sourceMaps: Promise.resolve(sourceMaps),
  });
};
