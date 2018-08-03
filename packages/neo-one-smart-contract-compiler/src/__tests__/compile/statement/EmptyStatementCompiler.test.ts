import { helpers } from '../../../__data__';

describe('EmptyStatementCompiler', () => {
  test('empty', async () => {
    await helpers.executeString(`
      ;
    `);
  });
});
