import { AttributeUsageModel } from '@neo-one/client-common';
import { factory, keys } from '../../../__data__';
import { attribute } from '../../../user/converters/attribute';

describe('attribute', () => {
  test('converts buffer attributes', () => {
    const attr = factory.createBufferAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsageModel.Description);
    expect(result.value).toEqual(Buffer.from(attr.data, 'hex'));
  });

  test('converts public key attributes', () => {
    const attr = factory.createPublicKeyAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsageModel.ECDH02);
    expect(result.value).toEqual(Buffer.from(attr.data, 'hex'));
  });

  test('converts address attributes', () => {
    const attr = factory.createAddressAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsageModel.Script);
    expect(result.value).toEqual(keys[0].scriptHash);
  });

  test('converts hash256 attributes', () => {
    const attr = factory.createHash256Attribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsageModel.Hash1);
    expect(result.value).toMatchSnapshot();
  });
});
