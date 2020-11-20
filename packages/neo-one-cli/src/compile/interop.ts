import { ContractABI } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-common';

const jmpABI = {
  name: '@Jmp',
  parameters: [
    {
      name: 'operation',
      type: 'String',
    },
    { name: 'args', type: 'Array' },
  ],
  returntype: 'ByteArray',
};
const dispatcherABI = {
  name: '@Dispatcher',
  parameters: [
    {
      name: 'operation',
      type: 'String',
    },
    {
      name: 'args',
      type: 'Array',
    },
  ],
  returntype: 'ByteArray',
};

const getJmpMethodDefinition = (contractName: string) => ({
  name: `${contractName},@Jmp`,
  id: '0',
  range: `0-2`,
  params: ['operation,String', 'args,Array'],
  return: '',
  variables: [],
  'sequence-points': [],
});

const getDispatcherMethodDefinition = (contractName: string, jumpAddress: number, finalAddress: number) => ({
  name: `${contractName},@Dispatcher`,
  id: '1',
  range: `${jumpAddress}-${finalAddress}`,
  params: ['operation,String', 'args,Array'],
  return: '',
  variables: [],
  'sequence-points': [],
});

interface NEOONEContractMetadata {
  readonly name: string;
  readonly description: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly storage: boolean;
  readonly dynamicInvoke: boolean;
  readonly payable: boolean;
}

const convertABIMetadata = (metadata: NEOONEContractMetadata) => ({
  title: metadata.name,
  description: metadata.description,
  version: metadata.codeVersion,
  author: metadata.author,
  email: metadata.email,
  'has-storage': metadata.storage,
  'has-dynamic-invoke': metadata.dynamicInvoke,
  'is-payable': metadata.payable,
});

const convertABI = (abi: ContractABI, metadata: NEOONEContractMetadata, script: Buffer) => ({
  hash: common.uInt160ToHex(crypto.toScriptHash(script)),
  entrypoint: '@Jmp',
  functions: [
    jmpABI,
    dispatcherABI,
    ...abi.methods.map((func) => ({
      name: func.name,
      parameters: func.parameters
        ? func.parameters.map(({ name, type }) => ({
            name,
            type,
          }))
        : [],
      returntype: func.returnType,
    })),
  ],
  events: abi.events.map((event) => ({
    name: event.name,
    parameters: event.parameters.map(({ name, type }) => ({
      name,
      type,
    })),
    returntype: 'Void',
  })),
  metadata: convertABIMetadata(metadata),
});

export { getJmpMethodDefinition, getDispatcherMethodDefinition, convertABI };
