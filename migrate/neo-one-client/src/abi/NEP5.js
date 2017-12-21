/* @flow */
import type { ABI, AddressLike } from '../types';

import converters from '../converters';

export default async (
  client: $FlowFixMe,
  hashIn: AddressLike,
): Promise<ABI> => {
  const hash = converters.hash160(client, hashIn);
  const decimalsFunction = {
    name: 'decimals',
    constant: true,
    returnType: 'Integer',
  };
  const decimalsBigNumber = await client
    .contract(
      ({
        hash,
        functions: [decimalsFunction],
      }: ABI),
    )
    .constant$.decimals();
  const decimals = decimalsBigNumber.toNumber();

  return {
    hash: converters.hash160(client, hash),
    functions: [
      {
        name: 'name',
        constant: true,
        returnType: 'String',
      },
      {
        name: 'symbol',
        constant: true,
        returnType: 'String',
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
        returnType: 'Boolean',
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
