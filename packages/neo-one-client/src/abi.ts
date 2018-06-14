import { ReadClient } from './ReadClient';
import { ABI, ABIFunction, Hash160String } from './types';

const decimalsFunction: ABIFunction = {
  name: 'decimals',
  constant: true,
  returnType: { type: 'Integer', decimals: 0 },
};

export const NEP5_STATIC = (decimals: number): ABI => ({
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
      constant: true,
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

export const NEP5 = async (client: ReadClient, hash: Hash160String): Promise<ABI> => {
  const decimalsBigNumber = await client.smartContract(hash, { functions: [decimalsFunction] }).decimals();
  const decimals = decimalsBigNumber.toNumber();

  return NEP5_STATIC(decimals);
};
