/* @flow */
// eslint-disable-next-line
export class FailedToKillProcessError extends Error {
  code: string;

  constructor(pid: number) {
    super(`Failed to kill process at ${pid}`);
    this.code = 'FAILED_TO_KILL_PROCESS';
  }
}
