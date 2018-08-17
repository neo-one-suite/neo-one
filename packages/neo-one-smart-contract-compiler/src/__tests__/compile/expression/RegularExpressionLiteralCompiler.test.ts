import { helpers } from '../../../__data__';

describe('RegularExpressionLiteralCompiler', () => {
  test('/foo/', async () => {
    helpers.compileString(
      `
      /foo/
    `,
      { type: 'error' },
    );
  });
});
