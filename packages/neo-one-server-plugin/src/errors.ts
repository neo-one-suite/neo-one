import { CustomError } from '@neo-one/utils';

// tslint:disable-next-line export-name
export class FailedToKillProcessError extends CustomError {
  public readonly code: string;

  public constructor(pid: number) {
    super(`Failed to kill process at ${pid}`);
    this.code = 'FAILED_TO_KILL_PROCESS';
  }
}
