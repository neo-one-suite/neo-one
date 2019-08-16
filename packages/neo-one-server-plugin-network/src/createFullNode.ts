import { FullNode, FullNodeOptions } from '@neo-one/node';
import * as fs from 'fs-extra';

export const createFullNode = async ({
  options,
  chainFile,
  dumpChainFile,
}: {
  readonly options: FullNodeOptions;
  readonly chainFile?: string;
  readonly dumpChainFile?: string;
}) => {
  await fs.ensureDir(options.dataPath);

  return new FullNode({ options, chainFile, dumpChainFile });
};
