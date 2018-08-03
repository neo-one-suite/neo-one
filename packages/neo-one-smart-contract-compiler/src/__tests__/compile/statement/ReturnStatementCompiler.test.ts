import { helpers } from '../../../__data__';

describe('ReturnStatementCompiler', () => {
  test('simple return', async () => {
    await helpers.executeString(`
      const x = () => {
        return;
      }

      assertEqual(x(), undefined);
    `);
  });

  test('try finally return', async () => {
    await helpers.executeString(`
      const x = () => {
        try {
          return 'foo';
        } finally {
          return 'bar';
        }
      }

      assertEqual(x(), 'bar');
    `);
  });
});
