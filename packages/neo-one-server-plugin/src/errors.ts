import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line:export-name
export const FailedToKillProcessError = makeErrorWithCode(
  'FAILED_TO_KILL_PROCESS',
  (pid: number) => `Failed to kill process at ${pid}`,
);
