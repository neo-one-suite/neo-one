import { ProcessErrorOptions } from '../common';

export const processError = async ({ message }: ProcessErrorOptions): Promise<string> => message;
