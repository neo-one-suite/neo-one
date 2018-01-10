/* @flow */
import { CustomError } from '@neo-one/utils';

// eslint-disable-next-line
export class FailedToKillProcessError extends CustomError {
  code: string;

  constructor(pid: number) {
    super(`Failed to kill process at ${pid}`);
    this.code = 'FAILED_TO_KILL_PROCESS';
  }
}
