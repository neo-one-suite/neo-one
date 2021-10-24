import { createChild, nodeLogger } from '@neo-one/logger';
import { createStart, Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { restore } from './restore';

const start = createStart(createChild(nodeLogger, { service: 'node-restore' }));

export const command = 'node-restore';
export const describe = 'Restore node data from Google bucket';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.string('path').string('bucket').string('folder').demandOption(['path', 'bucket', 'folder']);
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
          const result = runner.kill();

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    };
  });
};
