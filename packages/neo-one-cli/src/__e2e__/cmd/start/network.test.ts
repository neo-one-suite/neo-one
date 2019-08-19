import fetch from 'cross-fetch';

describe('start network', () => {
  it('starts a private network', async () => {
    const execAsync = one.createExecAsync('ico');
    execAsync('start network');
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
  });
});
