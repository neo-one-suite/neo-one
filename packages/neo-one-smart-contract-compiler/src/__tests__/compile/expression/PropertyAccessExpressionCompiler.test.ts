import { helpers } from '../../../__data__';

describe('PropertyAccessExpressionCompiler', () => {
  test('access object property', async () => {
    await helpers.executeString(`
      const bar = { x: '1', y: '2' };
      (bar.x = '2') + bar.y;
      if (bar.x + bar.y !== '22') {
        throw 'failure'
      }
    `);
  });

  test('set object property', async () => {
    await helpers.executeString(`
      const bar = { x: '1', y: '2' };
      bar.y;
      bar.y = '1';
      if ((bar.x = '2') + bar.y !== '21') {
        throw 'failure'
      }
    `);
  });

  test('access array', async () => {
    await helpers.executeString(`
      const bar = [1, 2, 3];

      assertEqual(bar.length, 3);
    `);
  });

  test('access array or object property', async () => {
    await helpers.executeString(`
      const bar: { length: number } | Array<number> = [1, 2, 3] as { length: number } | Array<number>;

      assertEqual(bar.length, 3);
    `);
  });

  test('optional chaining returns undefined when undefined', async () => {
    await helpers.executeString(`
      const bar: { optionalProp: number } | null | undefined = null as { optionalProp: number } | null | undefined;

      assertEqual(bar?.optionalProp, undefined);
    `);
  });

  test('optional chaining returns undefined when null', async () => {
    await helpers.executeString(`
      const bar: { optionalProp: number } | null | undefined = undefined as { optionalProp: number } | null | undefined;

      assertEqual(bar?.optionalProp, undefined);
    `);
  });

  test('optional chaining returns property when defined', async () => {
    await helpers.executeString(`
      const bar: { optionalProp: number } | null | undefined = { optionalProp: 10 } as { optionalProp: number } | null | undefined;

      assertEqual(bar?.optionalProp, 10);
    `);
  });

  test('nested optional chaining returns undefined when null', async () => {
    await helpers.executeString(`
      const bar: { first?: { second?: number } | null } | null | undefined = { first: null } as { first?: { second?: number } | null } | null | undefined;

      assertEqual(bar?.first?.second, undefined);
    `);
  });

  test('nested optional chaining returns undefined when undefined', async () => {
    await helpers.executeString(`
      const bar: { first?: { second?: number } | null } | null | undefined = { first: undefined } as { first?: { second: number } | null } | null | undefined;

      assertEqual(bar?.first?.second, undefined);
    `);
  });

  test('nested optional chaining returns property when defined', async () => {
    await helpers.executeString(`
      const bar: { first?: { second?: number } } | null | undefined = { first: { second: 10 } } as { first?: { second: number } } | null | undefined;

      assertEqual(bar?.first?.second, 10);
    `);
  });

  test('nested optional chaining returns property when undefined with non-null assertion', async () => {
    await helpers.executeString(`
      const bar: { first?: { second?: number } } | null | undefined = undefined as { first?: { second: number } } | null | undefined;

      assertEqual(bar?.first!.second, undefined);
    `);
  });
});
