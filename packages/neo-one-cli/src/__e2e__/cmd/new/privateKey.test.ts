import { common } from '@neo-one/client-common';

describe('new private-key', () => {
  it('logs new private key to the console', async () => {
    const exec = one.createExec('ico');
    const stdout = await exec('new private-key');

    const privateKey = common.stringToPrivateKey(stdout);
    expect(common.isPrivateKey(privateKey)).toBeTruthy();
  });
});
