import { helpers } from '../../../../../__data__';

describe('ToStringHelper', () => {
  test('array', async () => {
    await helpers.executeString(`
      const value: Array<number> = [0, 1, 2];

      assertEqual('' + value, '0,1,2');
    `);
  });

  test('boolean true', async () => {
    await helpers.executeString(`
      const value: boolean = true;

      assertEqual('' + value, 'true');
    `);
  });

  test('boolean false', async () => {
    await helpers.executeString(`
      const value: boolean = false;

      assertEqual('' + value, 'false');
    `);
  });

  test('buffer', async () => {
    await helpers.executeString(`
      const value: Buffer = Buffer.from('', 'hex');

      assertEqual('' + value, '');
    `);
  });

  test('null', async () => {
    await helpers.executeString(`
      const value: null = null;

      assertEqual('' + value, 'null');
    `);
  });

  test('number 0', async () => {
    await helpers.executeString(`
      const value: number = 0;

      assertEqual('' + value, '0');
    `);
  });

  test('number 1', async () => {
    await helpers.executeString(`
      const value: number = 1;

      assertEqual('' + value, '1');
    `);
  });

  test('object', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } = {
        toString() {
          return 'foo';
        }
      };

      assertEqual('' + value, 'foo');
    `);
  });

  test('object primitive', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => number } = {
        valueOf() {
          return 0;
        }
      };

      assertEqual('' + value, '0');
    `);
  });

  test('string ""', async () => {
    await helpers.executeString(`
      const value: string = '';

      assertEqual('' + value, '');
    `);
  });

  test('string "a"', async () => {
    await helpers.executeString(`
      const value: string = 'a';

      assertEqual('' + value, 'a');
    `);
  });

  test('symbol', async () => {
    await helpers.compileString(
      `
      '' + Symbol.for('a');
    `,
      { type: 'error' },
    );
  });

  test('undefined', async () => {
    await helpers.executeString(`
      const value: undefined = undefined;

      assertEqual('' + value, 'undefined');
    `);
  });

  test('array or undefined', async () => {
    await helpers.executeString(`
      const value: Array<number> | undefined = [] as Array<number> | undefined;

      assertEqual('' + value, '');
    `);
  });

  test('boolean or undefined true', async () => {
    await helpers.executeString(`
      const value: boolean | undefined = true as boolean | undefined;

      assertEqual('' + value, 'true');
    `);
  });

  test('boolean or undefined false', async () => {
    await helpers.executeString(`
      const value: boolean | undefined = false as boolean | undefined;

      assertEqual('' + value, 'false');
    `);
  });

  test('buffer or undefined', async () => {
    await helpers.executeString(`
      const value: Buffer | undefined = Buffer.from('', 'hex') as Buffer | undefined;

      assertEqual('' + value, '');
    `);
  });

  test('null or undefined', async () => {
    await helpers.executeString(`
      const value: null | undefined = null as null | undefined;

      assertEqual('' + value, 'null');
    `);
  });

  test('number or undefined 0', async () => {
    await helpers.executeString(`
      const value: number | undefined = 0 as number | undefined;

      assertEqual('' + value, '0');
    `);
  });

  test('number or undefined 1', async () => {
    await helpers.executeString(`
      const value: number | undefined = 1 as number | undefined;

      assertEqual('' + value, '1');
    `);
  });

  test('object or undefined', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } | undefined = {
        toString() {
          return 'foo';
        }
      } as { [key: string]: () => string } | undefined;

      assertEqual('' + value, 'foo');
    `);
  });

  test('object or undefined', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => number } | undefined = {
        valueOf() {
          return 1;
        }
      } as { [key: string]: () => number } | undefined;

      assertEqual('' + value, '1');
    `);
  });

  test('string or undefined ""', async () => {
    await helpers.executeString(`
      const value: string | undefined = '' as string | undefined;

      assertEqual('' + value, '');
    `);
  });

  test('string or undefined "a"', async () => {
    await helpers.executeString(`
      const value: string | undefined = 'a' as string | undefined;

      assertEqual('' + value, 'a');
    `);
  });

  test('array or object', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } = [0] as Array<number> | { [key: string]: number };

      assertEqual('' + value, '0');
    `);
  });

  test('array or object or number', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } | number = [0, 1] as Array<number> | { [key: string]: number } | number;

      assertEqual('' + value, '0,1');
    `);
  });
});
