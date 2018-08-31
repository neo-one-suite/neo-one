import { helpers } from '../../../../__data__';

describe('Symbol.toPrimitive', () => {
  test('should be a symbol', async () => {
    await helpers.executeString(`
      assertEqual(typeof Symbol.toPrimitive, 'symbol');
    `);
  });

  test('should equal itself', async () => {
    await helpers.executeString(`
      assertEqual(Symbol.toPrimitive, Symbol.toPrimitive);
    `);
  });

  test('cannot be set', async () => {
    helpers.compileString(
      `
      Symbol.toPrimitive = Symbol.for('foo');
    `,
      { type: 'error' },
    );
  });
});
