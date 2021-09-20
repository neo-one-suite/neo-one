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
export interface NEP17TransferEvent extends Event<'Transfer', NEP17TransferEventParameters> {}

export interface NEP17SmartContract<TClient extends Client = Client> extends SmartContract<TClient, NEP17Event> {
  readonly name: (options?: SmartContractReadOptions) => Promise<string>;
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

const DEFAULT_NEO_ONE_PARAM: ABIParameter = { type: 'String', name: NEO_ONE_METHOD_RESERVED_PARAM, optional: false };

const getDecimalsMethod = (decimals: number, isNEOONEContract: boolean): ContractMethodDescriptorClient => ({
  name: 'decimals',
  constant: true,
  parameters: isNEOONEContract ? [DEFAULT_NEO_ONE_PARAM] : [],
  returnType: { type: 'Integer', decimals },
  offset: 0,
  safe: true,
});

export const abi = (decimals: number, isNEOONEContract: boolean): ContractABIClient => ({
  methods: [
    {
      name: 'name',
      constant: true,
      parameters: isNEOONEContract ? [DEFAULT_NEO_ONE_PARAM] : [],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: isNEOONEContract ? [DEFAULT_NEO_ONE_PARAM] : [],
      returnType: { type: 'String' },
      offset: 0,
      safe: true,
    },
    getDecimalsMethod(decimals, isNEOONEContract),
    {
      name: 'totalSupply',
      constant: true,
      parameters: isNEOONEContract ? [DEFAULT_NEO_ONE_PARAM] : [],
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
          optional: false,
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
          optional: false,
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
          optional: false,
        },
      ],
    },
  ],
});

export const manifest = (decimals: number, isNEOONEContract: boolean): ContractManifestClient => ({
  name: 'A NEO•ONE NEP-17 Smart Contract',
  groups: [],
  supportedStandards: ['NEP-17'],
  abi: abi(decimals, isNEOONEContract),
  permissions: [],
  trusts: '*',
});

export const getDecimals = async (
  client: Client,
  networksDefinition: SmartContractNetworksDefinition,
  network: NetworkType,
  isNEOONEContract: boolean,
): Promise<number> => {
  const decimalsBigNumber = await client
    .smartContract(
      {
        networks: networksDefinition,
        manifest: {
          ...manifest(0, isNEOONEContract),
          abi: { events: [], methods: [getDecimalsMethod(0, isNEOONEContract)] },
        },
      },
      isNEOONEContract,
    )
    .decimals({ network });

  return decimalsBigNumber.toNumber();
};

export const createNEP17SmartContract = <TClient extends Client>(
  client: TClient,
  networksDefinition: SmartContractNetworksDefinition,
  decimals: number,
  isNEOONEContract: boolean,
): NEP17SmartContract =>
  client.smartContract<NEP17SmartContract<TClient>>(
    {
      networks: networksDefinition,
      manifest: manifest(decimals, isNEOONEContract),
    },
    isNEOONEContract,
  );
