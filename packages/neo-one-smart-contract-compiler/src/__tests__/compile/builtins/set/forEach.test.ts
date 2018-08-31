import ts from 'typescript';
import { helpers } from '../../../../__data__';
import { SetForEach } from '../../../../compile/builtins/set/forEach';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Set.prototype.forEach', () => {
  test('should apply a function over a set', async () => {
    await helpers.executeString(`
      const x = new Set<number>();
      x.add(1);
      x.add(1);
      x.add(2);
      x.add(3);
      let result = 0;
      const y = x.forEach((value) => {
        result += value;
      });
      x.forEach((value) => {
        result += value;
      });

      assertEqual(y, undefined);
      assertEqual(result, 12);
    `);
  });

  test('cannot be referenced', async () => {
    helpers.compileString(
      `
      const x = new Set<number>();
      const y = x.forEach;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be "referenced"', async () => {
    helpers.compileString(
      `
      const x = new Set<number>();
      const y = x['forEach'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall', () => {
    const builtin = new SetForEach();
    const expr = ts.createCall(ts.createIdentifier('foo'), undefined, [ts.createIdentifier('bar')]);

    // tslint:disable-next-line no-any
    expect(builtin.canCall(jest.fn() as any, jest.fn() as any, expr)).toBeTruthy();
  });
});
