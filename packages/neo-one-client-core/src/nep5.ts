import {
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

export type NEP5Event = NEP5TransferEvent;

export interface NEP5TransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface NEP5TransferEvent extends Event<'transfer', NEP5TransferEventParameters> {}

export interface NEP5SmartContract<TClient extends Client = Client> extends SmartContract<TClient, NEP5Event> {
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
  ) => TransactionResult<InvokeReceipt<boolean, NEP5Event>>;
}

const decimalsFunction: ContractMethodDescriptorClient = {
  name: 'decimals',
  constant: true,
  parameters: [],
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
      parameters: [],
      returnType: { type: 'String' },
      offset: 0,
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
      offset: 0,
    },
    decimalsFunction,
    {
      name: 'totalSupply',
      constant: true,
      parameters: [],
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

export const createNEP5SmartContract = <TClient extends Client>(
  client: TClient,
  networksDefinition: SmartContractNetworksDefinition,
  decimals: number,
): NEP5SmartContract =>
  client.smartContract<NEP5SmartContract<TClient>>({
    networks: networksDefinition,
    manifest: manifest(decimals),
  });
