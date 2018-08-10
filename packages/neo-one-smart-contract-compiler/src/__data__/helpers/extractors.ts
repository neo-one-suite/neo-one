import { CallReceiptJSON, convertCallReceipt } from '@neo-one/client-core';
import { RawSourceMap } from 'source-map';
import { processError, extractErrorTrace, createConsoleLogMessages } from '@neo-one/client-switch';
import { RawCallReceipt } from '@neo-one/client-core';

export const checkResult = async (receiptIn: CallReceiptJSON, sourceMap: RawSourceMap) => {
  const receipt = convertCallReceipt(receiptIn);

  return checkRawResult(receipt, sourceMap);
};

export const checkRawResult = async (receipt: RawCallReceipt, sourceMap: RawSourceMap) => {
  if (receipt.result.state === 'FAULT') {
    const [message, logs] = await Promise.all([
      processError({
        ...extractErrorTrace(receipt.actions),
        message: receipt.result.message,
        sourceMap,
      }),
      createConsoleLogMessages(receipt.actions, sourceMap),
    ]);
    const logMessage = logs.length === 0 ? '' : `\n${logs.join('\n\n')}`;
    throw new Error(`${message}${logMessage}\n`);
  }
};
