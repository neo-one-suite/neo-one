import fetch from 'cross-fetch';
import { isRunning } from '../../../common';

describe('start network', () => {
  it('starts a private network', async () => {
    const execAsync = one.createExecAsync('ico');
    execAsync('start network');
    const config = await one.getProjectConfig('ico');

    await one.until(async () => {
      const [live, ready] = await Promise.all([
        fetch(`http://localhost:${config.network.port}/live_health_check`),
        fetch(`http://localhost:${config.network.port}/ready_health_check`),
      ]);
      expect(live.ok).toEqual(true);
      expect(ready.ok).toEqual(true);
    });

    execAsync('start neotracker');

    await one.until(async () => {
      const live = await isRunning(config.neotracker.port);
      expect(live).toEqual(true);
    });

    await one.createExec('ico')('stop neotracker');
    let success = false;
    try {
      success = await isRunning(config.neotracker.port);
    } catch {
      // do nothing
    }
    expect(success).toEqual(false);
  });
});
