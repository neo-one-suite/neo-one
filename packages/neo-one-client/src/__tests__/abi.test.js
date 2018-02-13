/* @flow */
import { NEP5 } from '../abi';
import { testReadClient } from '../preconfigured';

describe('abi', () => {
  test('NEP5', async () => {
    const client = testReadClient();
    const hash = '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce';
    const decimalsFunction = {
      name: 'decimals',
      constant: true,
      returnType: { type: 'Integer', decimals: 0 },
    };
    const decimals = 10;
    const toNumber = { toNumber: () => decimals };
    const decimalMock = { decimals: () => toNumber };
    // $FlowFixMe
    client.smartContract = jest.fn(() => decimalMock);

    const expected = {
      functions: [
        {
          name: 'name',
          constant: true,
          returnType: { type: 'String' },
        },
        {
          name: 'symbol',
          constant: true,
          returnType: { type: 'String' },
        },
        decimalsFunction,
        {
          name: 'totalSupply',
          constant: true,
          returnType: { type: 'Integer', decimals },
        },
        {
          name: 'transfer',
          parameters: [
            {
              name: 'from',
              type: 'Hash160',
            },
            {
              name: 'to',
              type: 'Hash160',
            },
            {
              name: 'value',
              type: 'Integer',
              decimals,
            },
          ],
          returnType: { type: 'Boolean' },
        },
        {
          name: 'balanceOf',
          parameters: [
            {
              name: 'account',
              type: 'Hash160',
            },
          ],
          returnType: { type: 'Integer', decimals },
        },
      ],
      events: [
        {
          name: 'transfer',
          parameters: [
            {
              name: 'from',
              type: 'Hash160',
            },
            {
              name: 'to',
              type: 'Hash160',
            },
            {
              name: 'amount',
              type: 'Integer',
              decimals,
            },
          ],
        },
      ],
    };

    const result = await NEP5(client, hash);
    expect(result).toEqual(expected);
  });
});
