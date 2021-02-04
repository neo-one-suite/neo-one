import {
  ABIParameter,
  AddressString,
  ContractABIClient,
  ContractManifestClient,
  ContractMethodDescriptorClient,
  Event,
  InvokeReceipt,
  NetworkType,
  SmartContractNetworksDefinition,
  SmartContractReadOptions,
  TransactionOptions,
  TransactionResult,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { Client } from './Client';
import { SmartContract } from './types';

export type NEP17Event = NEP17TransferEvent;

export interface NEP17TransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface NEP17TransferEvent extends Event<'transfer', NEP17TransferEventParameters> {}

export interface NEP17SmartContract<TClient extends Client = Client> extends SmartContract<TClient, NEP17Event> {
  readonly balanceOf: (address: AddressString, options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly decimals: (options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly owner: (options?: SmartContractReadOptions) => Promise<AddressString>;
  readonly symbol: (options?: SmartContractReadOptions) => Promise<string>;
  readonly totalSupply: (options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly transfer: (
    from: AddressString,
    to: AddressString,
    amount: BigNumber,
    options?: TransactionOptions,
  ) => TransactionResult<InvokeReceipt<boolean, NEP17Event>>;
}

const defaultNEOONEParams: ReadonlyArray<ABIParameter> = [
  { type: 'String', name: 'method' },
  { type: 'Array', value: { type: 'Any' }, name: 'params' },
];

const decimalsFunction: ContractMethodDescriptorClient = {
  name: 'decimals',
  constant: true,
  parameters: [...defaultNEOONEParams],
  returnType: { type: 'Integer', decimals: 0 },
  offset: 0,
  safe: true,
};

export const abi = (decimals: number): ContractABIClient => ({
  methods: [
    {
      name: 'name',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    decimalsFunction,
    {
      name: 'totalSupply',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'Integer', decimals },
      offset: 0,
      safe: true,
    },
    {
      name: 'transfer',
      parameters: [
        {
          type: 'Hash160',
          name: 'from',
        },
        {
          type: 'Hash160',
          name: 'to',
        },
        {
          type: 'Integer',
          name: 'value',
          decimals,
        },
      ],
      returnType: { type: 'Boolean' },
      offset: 0,
      safe: false,
    },
    {
      name: 'balanceOf',
      constant: true,
      parameters: [
        {
          type: 'Hash160',
          name: 'account',
        },
      ],
      returnType: { type: 'Integer', decimals },
      offset: 0,
      safe: false,
    },
  ],
  events: [
    {
      name: 'transfer',
      parameters: [
        {
          type: 'Hash160',
          name: 'from',
          optional: true,
        },
        {
          type: 'Hash160',
          name: 'to',
          optional: true,
        },
        {
          type: 'Integer',
          name: 'amount',
          decimals,
        },
      ],
    },
  ],
});

export const manifest = (decimals: number): ContractManifestClient => ({
  name: '',
  groups: [],
  supportedStandards: [],
  abi: abi(decimals),
  permissions: [],
  trusts: '*',
});

export const getDecimals = async (
  client: Client,
  networksDefinition: SmartContractNetworksDefinition,
  network: NetworkType,
): Promise<number> => {
  const decimalsBigNumber = await client
    .smartContract({
      networks: networksDefinition,
      manifest: {
        ...manifest(0),
        abi: { events: [], methods: [decimalsFunction] },
      },
    })
    .decimals({ network });

  return decimalsBigNumber.toNumber();
};

export const createNEP17SmartContract = <TClient extends Client>(
  client: TClient,
  networksDefinition: SmartContractNetworksDefinition,
  decimals: number,
): NEP17SmartContract =>
  client.smartContract<NEP17SmartContract<TClient>>({
    networks: networksDefinition,
    manifest: manifest(decimals),
  });
