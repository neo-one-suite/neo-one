// tslint:disable no-object-mutation
import { BinaryWriter } from '@neo-one/client-common';
import { utils } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import { BufferStackItem, MapStackItem, StackItemType } from '../../stackItem';

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],

    args: [Buffer.alloc(10, 1)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],

    args: [Buffer.alloc(10, 1)],
    gas: FEES[100_000],
  },
  // This one is a bit odd because true turns into emitting an integer
  // stack item.
  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Integer)
          .writeVarBytesLE(Buffer.alloc(1, 1))
          .toBuffer(),
      ),
    ],

    args: [true],
    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(utils.toSignedBuffer(new BN('10000000000000', 10)))
          .toBuffer(),
      ),
    ],

    args: [new BN('10000000000000', 10)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Array)
          .writeVarUIntLE(1)
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(utils.toSignedBuffer(new BN('10000000000000', 10)))
              .toBuffer(),
          )
          .toBuffer(),
      ),
    ],

    args: [[new BN('10000000000000', 10)]],
    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Serialize',
    result: [],
    error: 'Item too large',

    args: [Buffer.alloc(1024 * 1024)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Map)
          .writeVarUIntLE(1)
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(Buffer.from('key', 'utf8'))
              .toBuffer(),
          )
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(Buffer.from('value', 'utf8'))
              .toBuffer(),
          )
          .toBuffer(),
      ),
    ],

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

    gas: FEES[100_000],
  },

  {
    name: 'System.Binary.Deserialize',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      new BinaryWriter()
        .writeUInt8(StackItemType.ByteArray)
        .writeVarBytesLE(Buffer.alloc(10, 1))
        .toBuffer(),
    ],

    gas: FEES[500_000],
  },

  {
    name: 'System.Binary.Deserialize',
    result: [
      new MapStackItem({
        referenceKeys: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('key', 'utf8')),
          ] as const,
        ]),
        referenceValues: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('value', 'utf8')),
          ] as const,
        ]),
      }),
    ],

    args: [
      new BinaryWriter()
        .writeUInt8(StackItemType.Map)
        .writeVarUIntLE(1)
        .writeBytes(
          new BinaryWriter()
            .writeUInt8(StackItemType.ByteArray)
            .writeVarBytesLE(Buffer.from('key', 'utf8'))
            .toBuffer(),
        )
        .writeBytes(
          new BinaryWriter()
            .writeUInt8(StackItemType.ByteArray)
            .writeVarBytesLE(Buffer.from('value', 'utf8'))
            .toBuffer(),
        )
        .toBuffer(),
    ],

    gas: FEES[500_000],
  },
];

describe('SysCalls: System.Binary', () => {
  runSysCalls(SYSCALLS);
});
