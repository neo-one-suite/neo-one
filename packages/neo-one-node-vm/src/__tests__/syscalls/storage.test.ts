// tslint:disable no-object-mutation
import { crypto } from '@neo-one/client-common';
import { StorageFlags, utils } from '@neo-one/node-core';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { BN } from 'bn.js';
import { runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import { BufferStackItem, NullStackItem, StorageContextStackItem } from '../../stackItem';

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Storage.GetContext',
    result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script))],

    gas: FEES[400],
  },

  {
    name: 'System.Storage.GetReadOnlyContext',
    result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script), true)],

    gas: FEES[400],
  },

  {
    name: 'System.Storage.Get',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(10, 1) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Storage.Get',
    result: [new NullStackItem()],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Storage.Find',
    result: () => (result) => {
      expect(result).toMatchSnapshot();
    },
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Storage.AsReadOnly',
    result: ({ transaction }) => (stack) => {
      expect(stack.length).toEqual(1);
      // It should equal the call's script hash.
      expect(stack[0].value).not.toEqual(crypto.toScriptHash(transaction.script));

      expect(stack[0].isReadOnly).toBeTruthy();
    },
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },
    ],

    gas: FEES[400],
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: utils.ZERO,
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1024, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1025, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102500000),
    error: 'Item too large',
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1024, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },
  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1024, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1025, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102500000),
  },

  {
    name: 'System.Storage.Delete',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ flags: StorageFlags.None }));
      blockchain.storageItem.delete = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[1_000_000],
  },
];

describe('SysCalls: System.Storage', () => {
  runSysCalls(SYSCALLS);
});
