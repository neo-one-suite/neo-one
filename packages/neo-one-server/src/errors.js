/* @flow */
import name from './name';

// eslint-disable-next-line
export class ServerRunningError extends Error {
  code: string;
  exitCode: number;

  constructor(pid: number) {
    super(`${name.title} running at pid ${pid}`);
    this.code = 'SERVER_RUNNING_ERROR';
    this.exitCode = 11;
  }
}
