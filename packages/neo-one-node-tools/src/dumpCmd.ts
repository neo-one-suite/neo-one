import { createChild, nodeLogger } from '@neo-one/logger';
import { createStart, Yarguments } from '@neo-one/utils-node';
import yargs from 'yargs';
import { dump } from './restore';

const start = createStart(createChild(nodeLogger, { service: 'node-restore' }));

export const command = 'node-dump';
export const describe = 'Dump node data to a Google bucket';
export const builder = (yargsBuilder: typeof yargs) =>
  yargsBuilder.string('path').string('bucket').string('folder').demandOption(['path', 'bucket', 'folder']);
export const handler = ({ path, bucket, folder }: Yarguments<ReturnType<typeof builder>>) => {
  start(async () => {
    const runner = dump({ path, bucket, folder });

    return () => {
      runner.kill();
    };
  });
};
