import { helpers } from '../../../__data__';

describe('TypeOfExpressionCompiler', () => {
  test('typeof undefined', async () => {
    await helpers.executeString(`
      const x = undefined;
      typeof x;
      assertEqual(typeof x, 'undefined');
    `);
  });

  test('typeof null', async () => {
    await helpers.executeString(`
      const x = null;
      assertEqual(typeof x, 'null');
    `);
  });

  test('typeof boolean', async () => {
    await helpers.executeString(`
      const x = true;
      assertEqual(typeof x, 'boolean');
    `);
  });

  test('typeof string', async () => {
    await helpers.executeString(`
      const x = 'x';
      assertEqual(typeof x, 'string');
    `);
  });

  test('typeof symbol', async () => {
    await helpers.executeString(`
      const x = Symbol.for('x');
      assertEqual(typeof x, 'symbol');
    `);
  });

  test('typeof number', async () => {
    await helpers.executeString(`
      const x = 0;
      assertEqual(typeof x, 'number');
    `);
  });

  test('typeof object', async () => {
    await helpers.executeString(`
      const x = {};
      assertEqual(typeof x, 'object');
    `);
  });
});
