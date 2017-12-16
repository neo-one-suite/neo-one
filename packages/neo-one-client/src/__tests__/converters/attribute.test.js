/* @flow */
/* eslint-disable no-loop-func */
import {
  BufferAttribute,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
} from '@neo-one/core';

import { utils as commonUtils } from '@neo-one/utils';

import ClientBase from '../../ClientBase';

import attribute from '../../converters/attribute';
import { keys } from '../../__data__';

const client = new ClientBase();

const tests = {
  Buffer: {
    usages: {
      DescriptionUrl: 0x81,
      Description: 0x90,
      Remark: 0xf0,
      Remark1: 0xf1,
      Remark2: 0xf2,
      Remark3: 0xf3,
      Remark4: 0xf4,
      Remark5: 0xf5,
      Remark6: 0xf6,
      Remark7: 0xf7,
      Remark8: 0xf8,
      Remark9: 0xf9,
      Remark10: 0xfa,
      Remark11: 0xfb,
      Remark12: 0xfc,
      Remark13: 0xfd,
      Remark14: 0xfe,
      Remark15: 0xff,
    },
    string: 'cef0c0fdcfe7838eff6ff104f9cdec2922297537',
    value: Buffer.from('cef0c0fdcfe7838eff6ff104f9cdec2922297537', 'hex'),
    constructor: BufferAttribute,
  },
  ECPoint: {
    usages: {
      ECDH02: 0x02,
      ECDH03: 0x03,
    },
    string: keys[0].publicKey,
    value: Buffer.from(keys[0].publicKey, 'hex'),
    constructor: ECPointAttribute,
  },
  UInt160Attribute: {
    usages: {
      Script: 0x20,
    },
    string: keys[0].scriptHash,
    value: keys[0].scriptHashUInt160,
    constructor: UInt160Attribute,
  },
  UInt256Attribute: {
    usages: {
      ContractHash: 0x00,
      Vote: 0x30,
      Hash1: 0xa1,
      Hash2: 0xa2,
      Hash3: 0xa3,
      Hash4: 0xa4,
      Hash5: 0xa5,
      Hash6: 0xa6,
      Hash7: 0xa7,
      Hash8: 0xa8,
      Hash9: 0xa9,
      Hash10: 0xaa,
      Hash11: 0xab,
      Hash12: 0xac,
      Hash13: 0xad,
      Hash14: 0xae,
      Hash15: 0xaf,
    },
    string:
      '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79',
    value: Buffer.from(
      '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
      'hex',
    ),
    constructor: UInt256Attribute,
  },
};

describe('attribute', () => {
  for (const testCase of commonUtils.values(tests)) {
    const { usages, string, value, constructor } = testCase;
    for (const [usage, usageValue] of commonUtils.entries(usages)) {
      test(`converts ${usage} to ${constructor.name}`, () => {
        const attr = attribute(client, ({ usage, value: string }: $FlowFixMe));
        const expected = new constructor({
          usage: usageValue,
          value,
        });
        expect(attr.usage).toEqual(expected.usage);
        expect(attr.value).toEqual(expected.value);
      });
    }
  }

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      attribute(client, false);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('throws on invalid usage', () => {
    try {
      // $FlowFixMe
      attribute(client, { usage: 'Foo', value: 'bar' });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
