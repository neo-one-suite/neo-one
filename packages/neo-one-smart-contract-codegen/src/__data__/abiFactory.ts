import { ABIDefault, ABIReturn, ContractABIClient } from '@neo-one/client-common';
import _ from 'lodash';

// tslint:disable-next-line:no-any
const getCombinations = (list: ReadonlyArray<ReadonlyArray<any>>) => {
  const floorsIn = list.reduceRight<ReadonlyArray<number>>((acc, right) => [right.length * acc[0]].concat(acc), [1]);
  const max = floorsIn[0];
  const floors = floorsIn.slice(1);

  const iteratorFuncs = list.map((item, index) =>
    index === list.length - 1
      ? (value: number) => item[value % item.length]
      : (value: number) => item[Math.floor(value / floors[index]) % item.length],
  );

  return _.range(max).map((_unused, index) => iteratorFuncs.map((func) => func(index)));
};

const abiFunctionOptions: ReadonlyArray<{ readonly [key in string]?: boolean }> = [
  { constant: true },
  { send: true },
  { sendUnsafe: true },
  { sendUnsafe: true, receive: true },
  { receive: true },
  { claim: true },
  { refundAssets: true },
  { completeSend: true },
  {},
];

const abiParameterOptions: ReadonlyArray<{ readonly [key in string]?: boolean | ABIDefault }> = [
  { default: { type: 'sender' } },
  { rest: true },
  { default: { type: 'sender' }, rest: true },
  {},
];

const abiReturns: ReadonlyArray<ABIReturn> = [
  {
    type: 'ForwardValue',
  },
  {
    type: 'Boolean',
    optional: true,
  },
  {
    type: 'Boolean',
    forwardedValue: true,
  },
  {
    type: 'Integer',
    decimals: 4,
  },
  {
    type: 'Array',
    value: {
      type: 'Boolean',
    },
  },
  {
    type: 'Map',
    key: { type: 'Integer', decimals: 0 },
    value: { type: 'Boolean' },
  },
  {
    type: 'Object',
    properties: {
      property: { type: 'Boolean' },
    },
  },
];

const boolReturnType: ABIReturn = { type: 'Boolean' };

const createBaseABIFunctions = (): ReadonlyArray<ContractABIClient> => {
  const combinations = getCombinations([abiReturns, abiFunctionOptions]);

  return combinations.map(([abiReturn, abiFuncProps]) => {
    const funcPropNames = Object.keys(abiFuncProps);
    const name = `${abiReturn.type}${`${funcPropNames.length === 0 ? '' : '_'}${funcPropNames.join('_')}`}`;

    return {
      methods: [
        {
          name,
          returnType: abiReturn,
          ...abiFuncProps,
        },
      ],
    };
  });
};

const createBaseABIEvents = (): ReadonlyArray<ContractABIClient> => {
  const combinations = getCombinations([abiReturns, abiParameterOptions]);

  return combinations.map(([abiReturn, abiParamProps]) => {
    const paramPropNames = Object.keys(abiParamProps);
    const name = `${abiReturn.type}${`${paramPropNames.length === 0 ? '' : '_'}${paramPropNames.join('_')}`}`;

    return {
      methods: [
        {
          name: 'foo',
          returnType: boolReturnType,
        },
      ],
      events: [
        {
          name,
          parameters: [
            {
              name: 'arg',
              ...abiReturn,
              ...abiParamProps,
            },
          ],
        },
      ],
    };
  });
};

const createBaseABIFunctionParameters = (): ReadonlyArray<ContractABIClient> => {
  const combinations = getCombinations([abiReturns, abiParameterOptions]);

  return combinations.map(([abiReturn, abiParamProps]) => {
    const paramPropNames = Object.keys(abiParamProps);
    const name = `${abiReturn.type}${`${paramPropNames.length === 0 ? '' : '_'}${paramPropNames.join('_')}`}`;

    return {
      methods: [
        {
          name,
          parameters: [
            {
              name: 'arg',
              ...abiReturn,
              ...abiParamProps,
            },
          ],
          returnType: boolReturnType,
        },
      ],
    };
  });
};

export const abiFactory = {
  createBaseABIFunctions,
  createBaseABIFunctionParameters,
  createBaseABIEvents,
};
