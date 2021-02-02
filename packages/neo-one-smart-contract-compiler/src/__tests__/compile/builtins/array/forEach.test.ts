import ts from 'typescript';
import { helpers } from '../../../../__data__';
import { ArrayForEach } from '../../../../compile/builtins/array/forEach';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Array.prototype.forEach', () => {
  test('should apply a function over an array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      const y = x.forEach((value) => {
        result += value;
      });

      assertEqual(y, undefined);
      assertEqual(result, 6);
    `);
  });

  test('should apply a function over an array with index', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      let result = 0;
      x['forEach']((value, idx) => {
        result += idx;
      });

      assertEqual(result, 3);
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x.forEach;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be "referenced"', async () => {
    await helpers.compileString(
      `
      const x = [0, 1, 2];
      const y = x['forEach'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall', () => {
    const builtin = new ArrayForEach();
    const expr = ts.createCall(ts.createIdentifier('foo'), undefined, [ts.createIdentifier('bar')]);

    // tslint:disable-next-line no-any
    expect(builtin.canCall(jest.fn() as any, jest.fn() as any, expr)).toBeTruthy();
  });
});
