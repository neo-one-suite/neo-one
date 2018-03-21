/* @flow */
declare module 'execa' {
  import type { ChildProcess } from 'child_process';
  import type { Readable } from 'stream';

  declare type PipeOption = string;

  declare export type ExecaOptions = {|
    cwd?: string,
    env?: Object,
    argv0?: string,
    stdio?: PipeOption | [PipeOption, PipeOption, PipeOption],
    stdin?: PipeOption,
    stdout?: PipeOption,
    stderr?: PipeOption,
    detached?: boolean,
    uid?: number,
    gid?: number,
    shell?: boolean | string,
    preferLocal?: boolean,
    localDir?: string,
    input?: string | Buffer | Readable,
    reject?: boolean,
    cleanup?: boolean,
    encoding?: string,
    maxBuffer?: number,
    killSignal?: string | number,
    windowsVerbatimArguments?: boolean,
    windowsHide?: boolean,
  |};

  declare export default {
    (file: string, args?: Array<string>, options?: ExecaOptions): ChildProcess & Promise<{| stdout: string, stderr: string |}>,
    stdout: (file: string, args?: Array<string>, options?: ExecaOptions) => ChildProcess & Promise<string>,
    stderr: (file: string, args?: Array<string>, options?: ExecaOptions) => ChildProcess & Promise<string>,
    shell: (command: string, options?: ExecaOptions) => ChildProcess & Promise<{| stdout: string, stderr: string |}>,
    sync: (file: string, args?: Array<string>, options?: ExecaOptions) => {| pid: number, output: Array<string>, stdout: string, stderr: string, status: number, signal: string, error: Error |},
  };
}
