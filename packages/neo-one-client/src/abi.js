/* @flow */
import type { ABI, Hash160String } from './types';
import type ReadClient from './ReadClient';

// eslint-disable-next-line
export const NEP5 = async (
  client: ReadClient<any>,
  hash: Hash160String,
): Promise<ABI> => {
  const decimalsFunction = {
    name: 'decimals',
    constant: true,
    returnType: { type: 'Integer', decimals: 0 },
  };
  const decimalsBigNumber = await client
    .smartContract(hash, { functions: [decimalsFunction] })
    .decimals();
  const decimals = decimalsBigNumber.toNumber();

  return {
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
};
