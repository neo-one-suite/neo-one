import { helpers } from '../../../../__data__';

describe('TemplateStringsArray', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyTemplateStringsArray implements TemplateStringsArray {
      }
    `,
      { type: 'error' },
    );
  });
});
