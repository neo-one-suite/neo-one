/* @flow */
import {
  BufferAttribute,
  ECPointAttribute,
  UInt160Attribute,
  UInt256Attribute,
  toAttributeUsage,
  common,
} from '@neo-one/client-core';

import { InvalidNamedArgumentError } from '../../../errors';
import attribute from '../../../user/converters/attribute';

const tests = {
  Buffer: {
    usages: [
      'DescriptionUrl',
      'Description',
      'Remark',
      'Remark1',
      'Remark2',
      'Remark3',
      'Remark4',
      'Remark5',
      'Remark6',
      'Remark7',
      'Remark8',
      'Remark9',
      'Remark10',
      'Remark11',
      'Remark12',
      'Remark13',
      'Remark14',
      'Remark15',
    ],
    data: 'cef0c0fdcfe7838eff6ff104f9cdec2922297537',
    value: Buffer.from('cef0c0fdcfe7838eff6ff104f9cdec2922297537', 'hex'),
    constructor: BufferAttribute,
  },
  ECPoint: {
    usages: ['ECDH02', 'ECDH03'],
    data: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
    value: common.stringToECPoint(
      '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
    ),
    constructor: ECPointAttribute,
  },
  UInt160Attribute: {
    usages: ['Script'],
    data: '3775292229eccdf904f16fff8e83e7cffdc0f0ce',
    value: common.stringToUInt160('3775292229eccdf904f16fff8e83e7cffdc0f0ce'),
    constructor: UInt160Attribute,
  },
  UInt256Attribute: {
    usages: [
      'ContractHash',
      'Vote',
      'Hash1',
      'Hash2',
      'Hash3',
      'Hash4',
      'Hash5',
      'Hash6',
      'Hash7',
      'Hash8',
      'Hash9',
      'Hash10',
      'Hash11',
      'Hash12',
      'Hash13',
      'Hash14',
      'Hash15',
    ],
    data: '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
    value: common.stringToUInt256(
      '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
    ),
    constructor: UInt256Attribute,
  },
};

describe('attribute', () => {
  for (const testCase of Object.keys(tests)) {
    const { usages, data, value, constructor } = tests[testCase];
    for (const usage of usages) {
      // eslint-disable-next-line
      test(`converts ${usage} to ${constructor.name}`, () => {
        const attr = attribute(({ usage, data }: $FlowFixMe));
        const expected = new constructor({
          usage: toAttributeUsage(usage),
          value,
        });
        expect(attr.usage).toEqual(expected.usage);
        expect(attr.value).toEqual(expected.value);
      });
    }
  }

  test('throws error on other input', () => {
    function testError() {
      attribute((false: $FlowFixMe));
    }

    expect(testError).toThrow(
      new InvalidNamedArgumentError('attribute', false),
    );
  });

  test('throws error on usage', () => {
    const badAttribute = { usage: 'bad', data: 'worse' };
    function testError() {
      attribute((badAttribute: $FlowFixMe));
    }

    expect(testError).toThrow(
      new InvalidNamedArgumentError('attribute', badAttribute),
    );
  });
});
