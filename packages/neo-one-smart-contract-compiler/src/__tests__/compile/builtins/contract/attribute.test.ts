import { helpers } from '../../../../__data__';

describe('Attribute', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      import { AttributeBase } from '@neo-one/smart-contract';

      class MyAttribute implements AttributeBase {
      }
    `,
      { type: 'error' },
    );
  });
});
