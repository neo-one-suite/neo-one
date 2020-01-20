// tslint:disable no-object-mutation
import { StorageFlags, StorageItem } from '@neo-one/node-core';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { BN } from 'bn.js';
import { runSysCalls, scriptAttributeHash, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import {
  BooleanStackItem,
  BufferStackItem,
  IntegerStackItem,
  IteratorStackItem,
  StackItemIterator,
} from '../../stackItem';

// tslint:disable-next-line readonly-array
const testArray = [1, 2, 3];
const testIterator: ReadonlyArray<{ readonly key: IntegerStackItem; readonly value: IntegerStackItem }> = [
  { key: new IntegerStackItem(new BN(0)), value: new IntegerStackItem(new BN(1)) },
  { key: new IntegerStackItem(new BN(1)), value: new IntegerStackItem(new BN(2)) },
  { key: new IntegerStackItem(new BN(2)), value: new IntegerStackItem(new BN(3)) },
];
const testAsyncIterable = AsyncIterableX.from(testIterator);
const nextItem = new StorageItem({
  hash: scriptAttributeHash,
  key: Buffer.from('key', 'utf-8'),
  value: Buffer.from('val', 'utf-8'),
  flags: StorageFlags.None,
});

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Iterator.Create',
    result: [new IteratorStackItem(new StackItemIterator(testAsyncIterable[Symbol.asyncIterator]()))],
    args: [testArray],
    gas: FEES[400],
  },

  {
    name: 'System.Iterator.Key',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value2', 'utf8'), Buffer.from('key2', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'System.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value1', 'utf8'), Buffer.from('key1', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'System.Iterator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(Buffer.from('key2', 'utf8'))],
    gas: FEES[400],
  },

  {
    name: 'System.Iterator.Key',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'SWAP',
            type: 'op',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Enumerator.Next',
                    type: 'sys',
                    args: [
                      {
                        type: 'calls',
                        calls: [
                          {
                            name: 'DUP',
                            type: 'op',
                            args: [
                              {
                                type: 'calls',
                                calls: [
                                  {
                                    name: 'System.Storage.Find',
                                    type: 'sys',
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
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.key), new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(0)]],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value', 'utf8'), Buffer.from('key', 'utf8')],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(0)]],
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1), new BN(2)]],
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new IntegerStackItem(new BN(1))],
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1)]],
          },

          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(2)]],
          },

          {
            name: 'System.Enumerator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(2)]],
          },

          {
            name: 'System.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1)]],
          },

          {
            name: 'System.Enumerator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new IntegerStackItem(new BN(2))],
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value2', 'utf8'), Buffer.from('key2', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'System.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value1', 'utf8'), Buffer.from('key1', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'System.Iterator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(Buffer.from('value2', 'utf8'))],
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.Find',
            type: 'sys',
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
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(Buffer.alloc(1, 1), Buffer.alloc(1, 2)));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.Find',
            type: 'sys',
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
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'SWAP',
            type: 'op',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Enumerator.Next',
                    type: 'sys',
                    args: [
                      {
                        type: 'calls',
                        calls: [
                          {
                            name: 'DUP',
                            type: 'op',
                            args: [
                              {
                                type: 'calls',
                                calls: [
                                  {
                                    name: 'System.Storage.Find',
                                    type: 'sys',
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
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.value), new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.Find',
            type: 'sys',
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
          },

          {
            name: 'System.Iterator.Values',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.value)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'System.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.Find',
            type: 'sys',
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
          },

          {
            name: 'System.Iterator.Keys',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'System.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.key)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ manifest: { hasStorage: true } }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },
];

describe('SysCalls: System.Iterator & System.Enumerator', () => {
  runSysCalls(SYSCALLS);
});
