// tslint:disable no-object-mutation
import { common, crypto, ScriptBuilder } from '@neo-one/client-common';
import { createContract, createContractAbi, createContractManifest } from '@neo-one/node-core';
import { of } from 'rxjs';
import { runSysCalls, TestCase, transactions } from '../../__data__';
import { FEES } from '../../constants';
import { BufferStackItem, ContractStackItem } from '../../stackItem';

const callingContract = createContract();
const contractToCallSB = new ScriptBuilder();
const contractToCall = createContract({
  script: contractToCallSB.build(),
  manifest: createContractManifest({
    abi: createContractAbi({
      hash: common.bufferToUInt160(Buffer.alloc(20, 1)),
    }),
  }),
});
const mockContractCallScriptHashString = common.uInt160ToString(
  crypto.hash160(new ScriptBuilder().emitSysCall('System.Contract.Call').build()),
);

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Contract.Update',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      // TODO: fix this test
      // Buffer.from([...transactions.kycContract.parameterList]),
      // transactions.kycContract.returnType,
      // transactions.kycContract.contractProperties,
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
      // tslint:disable-next-line: deprecation seems like a bug from rxjs; We don't want the scheduler definition anyway.
      blockchain.storageItem.getAll$ = jest.fn(of);
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },

  {
    name: 'System.Contract.Destroy',
    result: [],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
    error: `Contract Hash Not Found: ${common.uInt160ToString(common.bufferToUInt160(Buffer.alloc(20, 10)))}`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
    error: `Contract Hash Not Found: ${mockContractCallScriptHashString}`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('nonexistent-method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
    error: `Contract Method Undefined for Contract: ${mockContractCallScriptHashString}. Method: nonexistent-method`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('method2', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
    error: `Contract ${mockContractCallScriptHashString} does not have permission to call method2`,
  },

  {
    name: 'System.Contract.Call',
    result: [
      new BufferStackItem(Buffer.from('method1', 'utf-8')),
      new BufferStackItem(Buffer.from('arguments which need to be checked/changed', 'utf-8')),
    ],
    args: [
      Buffer.alloc(20, 1),
      Buffer.from('method1', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
  },
];

describe('SysCalls: System.Contract', () => {
  runSysCalls(SYSCALLS);
});
