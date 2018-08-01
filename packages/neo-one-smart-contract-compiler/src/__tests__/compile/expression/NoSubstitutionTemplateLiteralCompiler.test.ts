import { helpers } from '../../../__data__';

describe('NoSubstitutionTemplateLiteralCompiler', () => {
  test('`hello world`', async () => {
    await helpers.executeString(`
      if (\`hello world\` !== 'hello world') {
        throw 'Failure';
      }
    `);
  });
});
