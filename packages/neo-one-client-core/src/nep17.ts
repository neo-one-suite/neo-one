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
import { NEO_ONE_METHOD_RESERVED_PARAM } from './sc';
import { SmartContract } from './types';

export type NEP17Event = NEP17TransferEvent;

export interface NEP17TransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface NEP17TransferEvent extends Event<'transfer', NEP17TransferEventParameters> {}

export interface NEP17SmartContract<TClient extends Client = Client> extends SmartContract<TClient, NEP17Event> {
  readonly symbol: (options?: SmartContractReadOptions) => Promise<string>;
  readonly decimals: (options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly totalSupply: (options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly balanceOf: (address: AddressString, options?: SmartContractReadOptions) => Promise<BigNumber>;
  readonly owner: (options?: SmartContractReadOptions) => Promise<AddressString>;
  readonly transfer: (
    from: AddressString,
    to: AddressString,
    amount: BigNumber,
    options?: TransactionOptions,
  ) => TransactionResult<InvokeReceipt<boolean, NEP17Event>>;
}

const DEFAULT_NEO_ONE_PARAM: ABIParameter = { type: 'String', name: NEO_ONE_METHOD_RESERVED_PARAM };

const getDecimalsMethod = (decimals: number): ContractMethodDescriptorClient => ({
  name: 'decimals',
  constant: true,
  parameters: [DEFAULT_NEO_ONE_PARAM],
  returnType: { type: 'Integer', decimals },
  offset: 0,
  safe: true,
});

export const abi = (decimals: number): ContractABIClient => ({
  methods: [
    {
      name: 'name',
      constant: true,
      parameters: [DEFAULT_NEO_ONE_PARAM],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [DEFAULT_NEO_ONE_PARAM],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    getDecimalsMethod(decimals),
    {
      name: 'totalSupply',
      constant: true,
      parameters: [DEFAULT_NEO_ONE_PARAM],
      returnType: { type: 'Integer', decimals },
      offset: 0,
      safe: true,
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
          name: 'amount',
          decimals,
        },
        {
          type: 'Any',
          name: 'data',
        },
      ],
      returnType: { type: 'Boolean' },
      offset: 0,
      safe: false,
    },
  ],
  events: [
    {
      name: 'Transfer',
      parameters: [
        {
          type: 'Hash160',
          name: 'from',
          optional: false,
        },
        {
          type: 'Hash160',
          name: 'to',
          optional: false,
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
  name: 'A NEO•ONE NEP-17 Smart Contract',
  groups: [],
  supportedStandards: ['NEP-17'],
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
        abi: { events: [], methods: [getDecimalsMethod(0)] },
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
