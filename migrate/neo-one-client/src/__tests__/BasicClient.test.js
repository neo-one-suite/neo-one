/* @flow */
import { VM_STATE } from '@neo-one/client-core';

import BasicClient from '../BasicClient';

import { keys } from '../__data__';

describe('BasicClient', () => {
  const client = new BasicClient();

  test('contract', async () => {
    // $FlowFixMe
    client.testInvokeRaw = jest.fn(() =>
      Promise.resolve({
        state: VM_STATE.HALT,
        stack: [{ type: 'Integer', value: '10' }],
      }),
    );
    const abi = await client.abi.NEP5(keys[0].scriptHash);

    expect(client.contract(abi)).toBeTruthy();
  });
});
