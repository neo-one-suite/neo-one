import {
  ABIParameter,
  AddressString,
  common,
  ContractABIClient,
  ContractManifestClient,
  ContractMethodDescriptorClient,
  crypto,
  Event,
  InvokeReceipt,
  NetworkType,
  ScriptBuilder,
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
  readonly name: (options?: SmartContractReadOptions) => Promise<string>;
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
};

// TODO: check that the script/hash can/should be blank here. also check offsets
const blankScript = new ScriptBuilder().build();
const blankHash = crypto.toScriptHash(blankScript);

export const abi = (decimals: number): ContractABIClient => ({
  hash: common.uInt160ToString(blankHash),
  methods: [
    {
      name: 'name',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'String' },
      offset: 0,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'String' },
      offset: 0,
    },
    decimalsFunction,
    {
      name: 'totalSupply',
      constant: true,
      parameters: [...defaultNEOONEParams],
      returnType: { type: 'Integer', decimals },
      offset: 0,
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

// TODO: check that the script/hash can/should be blank here
export const manifest = (decimals: number): ContractManifestClient => ({
  hash: common.uInt160ToString(blankHash),
  groups: [],
  features: {
    storage: true,
    payable: true,
  },
  supportedStandards: [],
  abi: abi(decimals),
  permissions: [],
  trusts: '*',
  safeMethods: '*',
  hasStorage: true,
  payable: true,
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
        abi: { hash: manifest(0).hash, events: [], methods: [decimalsFunction] },
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
