import ts from 'typescript';
import { helpers } from '../../../../__data__';
import { MapForEach } from '../../../../compile/builtins/map/forEach';
import { DiagnosticCode } from '../../../../DiagnosticCode';

describe('Map.prototype.forEach', () => {
  test('should apply a function over a map', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      let result = 0;
      let valueResult = 0;
      const y = x.forEach((value) => {
        valueResult += value;
      });

      assertEqual(y, undefined);
      assertEqual(valueResult, 6);
    `);
  });

  test('should apply a function over a map with key', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.set('b', 2);
      x.set('c', 3);
      let valueResult = 0;
      let keyResult = '';
      x['forEach']((value, key) => {
        valueResult += value;
        keyResult += key;
      });

      assertEqual(valueResult, 6);
      assertEqual(keyResult, 'abc');
    `);
  });

  test('cannot be referenced', async () => {
    await helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x.forEach;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be referenced - object literal', async () => {
    await helpers.compileString(
      `
      const x = new Map<string, number>();
      const { forEach } = x;
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('cannot be "referenced"', async () => {
    await helpers.compileString(
      `
      const x = new Map<string, number>();
      const y = x['forEach'];
    `,
      { type: 'error', code: DiagnosticCode.InvalidBuiltinReference },
    );
  });

  test('canCall', () => {
    const builtin = new MapForEach();
    const expr = ts.createCall(ts.createIdentifier('foo'), undefined, [ts.createIdentifier('bar')]);

    // tslint:disable-next-line no-any
    expect(builtin.canCall(jest.fn() as any, jest.fn() as any, expr)).toBeTruthy();
  });
});
