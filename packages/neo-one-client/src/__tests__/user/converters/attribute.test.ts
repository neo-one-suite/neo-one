import { AttributeUsage } from '@neo-one/client-core';
import { factory, keys } from '../../../__data__';
import { attribute } from '../../../user/converters/attribute';

describe('attribute', () => {
  test('converts buffer attributes', () => {
    const attr = factory.createBufferAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsage.Description);
    expect(result.value).toEqual(Buffer.from(attr.data, 'hex'));
  });

  test('converts public key attributes', () => {
    const attr = factory.createPublicKeyAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsage.ECDH02);
    expect(result.value).toEqual(Buffer.from(attr.data, 'hex'));
  });

  test('converts address attributes', () => {
    const attr = factory.createAddressAttribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsage.Script);
    expect(result.value).toEqual(keys[0].scriptHash);
  });

  test('converts hash256 attributes', () => {
    const attr = factory.createHash256Attribute();

    const result = attribute(attr);

    expect(result.usage).toEqual(AttributeUsage.Hash1);
    expect(result.value).toMatchSnapshot();
  });
});
