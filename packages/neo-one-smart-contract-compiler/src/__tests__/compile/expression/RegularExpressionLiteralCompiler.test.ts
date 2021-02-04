import { helpers } from '../../../__data__';

describe('RegularExpressionLiteralCompiler', () => {
  test('/foo/', async () => {
    await helpers.compileString(
      `
      /foo/
    `,
      { type: 'error' },
    );
  });
});
