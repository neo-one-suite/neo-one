import { createChild, nodeLogger } from '@neo-one/logger';
import { createStart, Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { restore } from './restore';

const start = createStart(createChild(nodeLogger, { service: 'node-restore' }));

export const command = 'node-restore';
export const describe = 'restore node data from google bucket';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder
    .string('path')
    .string('bucket')
    .string('folder')
    .demandOption(['path', 'bucket', 'folder']);
export const handler = ({ path, bucket, folder }: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const restoreFunc = await restore({ path, bucket, folder });

    if (restoreFunc === undefined) {
      return async () => {
        await Promise.resolve();
      };
    }

    const runner = restoreFunc();

    return async () => {
      await new Promise((resolve, reject) => {
        try {
          runner.kill();

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
  });
};
