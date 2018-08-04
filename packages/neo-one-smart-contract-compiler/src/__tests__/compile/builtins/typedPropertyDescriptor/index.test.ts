import { helpers } from '../../../../__data__';

describe('TypedPropertyDescriptor', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyTypedPropertyDescriptor implements TypedPropertyDescriptor<number> {
      }

      const x = new MyTypedPropertyDescriptor();
      assertEqual(x !== undefined, true);
    `);
  });
});
