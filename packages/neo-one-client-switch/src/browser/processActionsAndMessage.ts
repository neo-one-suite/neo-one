import { processActionsAndMessage as processActionsAndMessageBase, ProcessActionsAndMessageOptions } from '../common';
import { initializeSourceMap } from './initializeSourceMap';

export const processActionsAndMessage = async (options: ProcessActionsAndMessageOptions): Promise<string> => {
  if (process.env.NODE_ENV === 'PRODUCTION') {
    return options.message;
  }

  initializeSourceMap();

  return processActionsAndMessageBase(options);
};
