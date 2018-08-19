import { SourceMaps } from '@neo-one/client';
import { CallReceiptJSON, convertCallReceipt, RawCallReceipt } from '@neo-one/client-core';
import { createConsoleLogMessages, extractErrorTrace, processError } from '@neo-one/client-switch';

export const checkResult = async (receiptIn: CallReceiptJSON, sourceMaps: SourceMaps) => {
  const receipt = convertCallReceipt(receiptIn);

  return checkRawResult(receipt, sourceMaps);
};

export const checkRawResult = async (receipt: RawCallReceipt, sourceMaps: SourceMaps) => {
  if (receipt.result.state === 'FAULT') {
    const [message, logs] = await Promise.all([
      processError({
        ...extractErrorTrace(receipt.actions),
        message: receipt.result.message,
        sourceMaps,
      }),
      createConsoleLogMessages(receipt.actions, sourceMaps),
    ]);
    const logMessage = logs.length === 0 ? '' : `\n${logs.join('\n\n')}`;
    throw new Error(`${message}${logMessage}\n`);
  }
};
