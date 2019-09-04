import { processConsoleLogMessages as processConsoleLogMessagesBase, ProcessConsoleLogOptions } from '../common';

export const processConsoleLogMessages = async (options: ProcessConsoleLogOptions): Promise<void> => {
  if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
    await processConsoleLogMessagesBase(options);
  }
};
