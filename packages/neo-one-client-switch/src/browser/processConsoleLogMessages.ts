import { processConsoleLogMessages as processConsoleLogMessagesBase, ProcessConsoleLogOptions } from '../common';
import { initializeSourceMap } from './initializeSourceMap';

export const processConsoleLogMessages = async (options: ProcessConsoleLogOptions): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    initializeSourceMap();

    await processConsoleLogMessagesBase(options);
  }
};
