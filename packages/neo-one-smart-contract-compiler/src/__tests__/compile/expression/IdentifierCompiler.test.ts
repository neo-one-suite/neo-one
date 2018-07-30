import { helpers } from '../../../__data__';

describe('IdentifierCompiler', () => {
  test('valid identifiers', async () => {
    await helpers.executeString(`
    let $variable = 'valid';
    let _var_i_able_ = 'valid';
    let $holy$dollar$batman$ = 'valid';
    `);
  });
  test('this is not CSS, identifiers cannot have hyphens', async () => {
    await helpers.compileString(
      `
      let hyphenated-variable = 'invalid';
      `,
      { type: 'error' },
    );
  });
  test('identifiers may contain but not start with numbers', async () => {
    await helpers.compileString(
      `
      let 1BigVariable = 'invalid';
      `,
      { type: 'error' },
    );
  });
});
