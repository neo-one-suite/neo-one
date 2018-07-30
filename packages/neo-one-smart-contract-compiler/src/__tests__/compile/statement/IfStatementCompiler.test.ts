import { helpers } from '../../../__data__';

describe('IfStatementCompiler', () => {
  test('simple if', async () => {
    await helpers.executeString(`
      const value: boolean = true;
      if (!true) {
        throw 'Failure';
      }
    `);
  });
});
