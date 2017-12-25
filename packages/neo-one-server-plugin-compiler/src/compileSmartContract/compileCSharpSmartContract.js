/* @flow */
import type { ABI } from '@neo-one/client';
import type { Binary } from '@neo-one/server-plugin';

import { execFile } from 'child_process';

export default async ({
  scPath,
  avmPath,
  binary,
}: {|
  scPath: string,
  avmPath: string,
  binary: Binary,
|}): Promise<?ABI> =>
  new Promise((resolve, reject) => {
    execFile(
      binary.cmd,
      [binary.firstArg, 'compile', 'csharp', scPath, avmPath],
      (err, stdout) => {
        if (err) {
          reject(new Error(`C# compilation failed: ${stdout}`));
        } else {
          resolve(null);
        }
      },
    );
  });
