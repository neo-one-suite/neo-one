/* @flow */
import type { Binary } from '@neo-one/server-plugin';

import { execFile } from 'child_process';

import type { CompileResult } from './index';

export default ({
  scPath,
  avmPath,
  binary,
}: {|
  scPath: string,
  avmPath: string,
  binary: Binary,
|}): Promise<CompileResult> =>
  new Promise((resolve, reject) => {
    execFile(
      binary.cmd,
      binary.firstArgs.concat(['compile', 'csharp', scPath, avmPath]),
      (err, stdout) => {
        if (err) {
          reject(new Error(`C# compilation failed: ${stdout}`));
        } else {
          resolve(({}: $FlowFixMe));
        }
      },
    );
  });
