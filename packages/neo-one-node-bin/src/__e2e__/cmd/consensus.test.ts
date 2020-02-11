/// <reference types="@neo-one/build-tools/types/e2e" />

import { NEOONEDataProvider } from '@neo-one/client';
import fetch from 'cross-fetch';
import fs from 'fs-extra';
// tslint:disable-next-line: match-default-export-name
import nodePath from 'path';
import { consensus as testConfig } from '../../__data__/configs';

describe('node-bin consensus', () => {
  it('starts private consensus', async () => {
    const { exec: execAsync, env } = one.createNodeProject('node-consensus');
    const tmpDir = env.NEO_ONE_TMP_DIR === undefined ? process.cwd() : env.NEO_ONE_TMP_DIR;
    const port = parseInt(env.NEO_ONE_PORT_0 === undefined ? '10000' : env.NEO_ONE_PORT_0, 10);

    const provider = new NEOONEDataProvider({
      network: 'local',
      rpcURL: `http://localhost:${port}/rpc`,
    });

    const dataPath = nodePath.join(tmpDir, 'data');
    const configPath = nodePath.join(tmpDir, 'config.json');
    const config = testConfig(port, dataPath);
    await fs.writeFile(configPath, JSON.stringify(config));

    execAsync(`--config ${configPath}`);

    await one.until(async () => {
      const [live, ready] = await Promise.all([
        fetch(`http://localhost:${port}/live_health_check`),
        fetch(`http://localhost:${port}/ready_health_check`),
      ]);
      expect(live.ok).toEqual(true);
      expect(ready.ok).toEqual(true);

      const firstBlockCount = await provider.getBlockCount();
      expect(firstBlockCount).toBeGreaterThan(0);

      // wait a bit for a new block to be produced
      await new Promise<void>((resolve) => setTimeout(resolve, 5000));

      const secondBlockCount = await provider.getBlockCount();
      expect(secondBlockCount).toBeGreaterThan(firstBlockCount);
    });
  });
});
