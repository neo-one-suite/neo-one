import { processActionsAndMessage as processActionsAndMessageBase, ProcessActionsAndMessageOptions } from '../common';

export const processActionsAndMessage = async (options: ProcessActionsAndMessageOptions): Promise<string> =>
  processActionsAndMessageBase(options);
