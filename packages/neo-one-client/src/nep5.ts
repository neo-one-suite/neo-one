import BigNumber from 'bignumber.js';
import { Client } from './Client';
import { ReadClient } from './ReadClient';
import {
  ABI,
  ABIFunction,
  AddressString,
  Event,
  InvokeReceipt,
  ReadSmartContract,
  SmartContract,
  SmartContractNetworksDefinition,
  TransactionOptions,
  TransactionResult,
} from './types';

export type NEP5Event = NEP5TransferEvent;

export interface NEP5TransferEventParameters {
  readonly from: AddressString | undefined;
  readonly to: AddressString | undefined;
  readonly amount: BigNumber;
}
export interface NEP5TransferEvent extends Event<'transfer', NEP5TransferEventParameters> {}

export interface NEP5SmartContract extends SmartContract<NEP5ReadSmartContract> {
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<AddressString>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
  readonly transfer: (
    from: AddressString,
    to: AddressString,
    amount: BigNumber,
    options?: TransactionOptions,
  ) => TransactionResult<InvokeReceipt<boolean, NEP5Event>>;
}

export interface NEP5ReadSmartContract extends ReadSmartContract<NEP5Event> {
  readonly balanceOf: (address: AddressString) => Promise<BigNumber>;
  readonly decimals: () => Promise<BigNumber>;
  readonly name: () => Promise<string>;
  readonly owner: () => Promise<AddressString>;
  readonly symbol: () => Promise<string>;
  readonly totalSupply: () => Promise<BigNumber>;
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

export const getDecimals = async (client: ReadClient, address: AddressString): Promise<number> => {
  const decimalsBigNumber = await client.smartContract({ address, abi: { functions: [decimalsFunction] } }).decimals();

  return decimalsBigNumber.toNumber();
};

export const createNEP5SmartContract = (
  client: Client,
  networksDefinition: SmartContractNetworksDefinition,
  decimals: number,
): NEP5SmartContract =>
  client.smartContract<NEP5SmartContract>({
    networks: networksDefinition,
    abi: abi(decimals),
  });

export const createNEP5ReadSmartContract = (
  client: ReadClient,
  address: string,
  decimals: number,
): NEP5ReadSmartContract =>
  client.smartContract<NEP5ReadSmartContract>({
    address,
    abi: abi(decimals),
  });
