import { helpers } from '../../../../__data__';

describe('Symbol.iterator', () => {
  test('should be a symbol', async () => {
    await helpers.executeString(`
      Symbol.iterator;
      assertEqual(typeof Symbol.iterator, 'symbol');
    `);
  });

  test('should equal itself', async () => {
    await helpers.executeString(`
      const { iterator } = Symbol;
      assertEqual(iterator, Symbol.iterator);
    `);
  });

  test('cannot be set', async () => {
    helpers.compileString(
      `
      Symbol.iterator = Symbol.for('foo');
    `,
      { type: 'error' },
    );
  });
});
