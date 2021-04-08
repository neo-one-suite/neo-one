import { AttributeTypeModel } from '@neo-one/client-common';
import { factory } from '../../../__data__';
import { attribute } from '../../../user/converters/attribute';

describe('attribute', () => {
  test('converts buffer attributes', () => {
    const attr = factory.createHighPriorityAttribute();

    const result = attribute(attr);

    expect(result.type).toEqual(AttributeTypeModel.HighPriority);
    expect(result.allowMultiple).toEqual(true);
  });

  test('converts public key attributes', () => {
    const attr = factory.createOracleResponse();

    const result = attribute(attr);

    expect(result.type).toEqual(AttributeTypeModel.OracleResponse);
    expect(result.allowMultiple).toEqual(true);
  });
});
