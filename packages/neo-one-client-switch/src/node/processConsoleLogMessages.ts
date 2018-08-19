import { processConsoleLogMessages as processConsoleLogMessagesBase, ProcessConsoleLogOptions } from '../common';

export const processConsoleLogMessages = async (options: ProcessConsoleLogOptions): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    await processConsoleLogMessagesBase(options);
  }
};
