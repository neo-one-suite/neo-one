import {
  ABI,
  ABIFunction,
  AddressString,
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

const decimalsFunction: ABIFunction = {
  name: 'decimals',
  constant: true,
  parameters: [],
  returnType: { type: 'Integer', decimals: 0 },
};

export const abi = (decimals: number): ABI => ({
  functions: [
    {
      name: 'name',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
    },
    {
      name: 'symbol',
      constant: true,
      parameters: [],
      returnType: { type: 'String' },
    },
    decimalsFunction,
    {
      name: 'totalSupply',
      constant: true,
      parameters: [],
      returnType: { type: 'Integer', decimals },
    },
    {
      name: 'transfer',
      parameters: [
        {
          type: 'Address',
          name: 'from',
        },
        {
          type: 'Address',
          name: 'to',
        },
        {
          type: 'Integer',
          name: 'value',
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
          type: 'Address',
          name: 'account',
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
          type: 'Address',
          name: 'from',
          optional: true,
        },
        {
          type: 'Address',
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

export const getDecimals = async (
  client: Client,
  networksDefinition: SmartContractNetworksDefinition,
  network: NetworkType,
): Promise<number> => {
  const decimalsBigNumber = await client
    .smartContract({ networks: networksDefinition, abi: { functions: [decimalsFunction] } })
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
    abi: abi(decimals),
  });
