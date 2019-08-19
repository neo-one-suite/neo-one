import fetch from 'cross-fetch';

describe('stop network', () => {
  it('stops a private network', async () => {
    one.createExecAsync('ico')('start network');
    const {
      network: { port },
    } = await one.getProjectConfig('ico');

    await one.until(async () => {
      const [live, ready] = await Promise.all([
        fetch(`http://localhost:${port}/live_health_check`),
        fetch(`http://localhost:${port}/ready_health_check`),
      ]);
      expect(live.ok).toEqual(true);
      expect(ready.ok).toEqual(true);
    });

    await one.createExec('ico')('stop network');
    let success = false;
    try {
      await fetch(`http://localhost:${port}/live_health_check`);
      success = true;
    } catch {
      // do nothing
    }
    expect(success).toEqual(false);
  });
});
