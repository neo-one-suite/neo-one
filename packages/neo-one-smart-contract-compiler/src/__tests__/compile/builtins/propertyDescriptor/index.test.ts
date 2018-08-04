import { helpers } from '../../../../__data__';

describe('PropertyDescriptor', () => {
  test('can be implemented', async () => {
    await helpers.executeString(`
      class MyPropertyDescriptor implements PropertyDescriptor {
      }

      const x = new MyPropertyDescriptor();
      assertEqual(x !== undefined, true);
    `);
  });
});
