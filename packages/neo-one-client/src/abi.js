/* @flow */
import type { ABI, Hash160String } from './types';
import type ReadClient from './ReadClient';

const decimalsFunction = {
  name: 'decimals',
  constant: true,
  returnType: { type: 'Integer', decimals: 0 },
};

export const NEP5_STATIC = (decimals: number) => ({
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
});

export const NEP5 = async (
  client: ReadClient<any>,
  hash: Hash160String,
): Promise<ABI> => {
  const decimalsBigNumber = await client
    .smartContract(hash, { functions: [decimalsFunction] })
    .decimals();
  const decimals = decimalsBigNumber.toNumber();

  return NEP5_STATIC(decimals);
};
