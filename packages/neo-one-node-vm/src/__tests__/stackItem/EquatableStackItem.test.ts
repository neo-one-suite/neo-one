import { factory } from '../../__data__';
import { AttributeStackItem } from '../../stackItem';

describe('EquatableKey Stack Item', () => {
  const bufferAttribute = factory.createBufferAttribute();
  const ecPointAttribute = factory.createECPointAttribute();
  const bufferAttributeStackItem = new AttributeStackItem(bufferAttribute);
  const ecPointAttributeStackItem = new AttributeStackItem(ecPointAttribute);

  test('toStructuralKey', () => {
    expect(bufferAttributeStackItem.toStructuralKey()).toMatchSnapshot();
  });

  test('equals - undefined other', () => {
    expect(bufferAttributeStackItem.equals(undefined)).toBeFalsy();
  });

  test('equals - same value', () => {
    expect(bufferAttributeStackItem.equals(bufferAttributeStackItem)).toBeTruthy();
  });

  test('equals - other stack item', () => {
    expect(bufferAttributeStackItem.equals(ecPointAttributeStackItem)).toBeFalsy();
  });
});
