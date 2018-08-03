import { helpers } from '../../../../__data__';

describe('Symbol.iterator', () => {
  test('should be a symbol', async () => {
    await helpers.executeString(`
      assertEqual(typeof Symbol.iterator, 'symbol');
    `);
  });

  test('should equal itself', async () => {
    await helpers.executeString(`
      assertEqual(Symbol.iterator, Symbol.iterator);
    `);
  });
});
