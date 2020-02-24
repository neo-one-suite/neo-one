import { helpers } from '../../../../../__data__';

describe('ToNullishBooleanHelper', () => {
  test('array', async () => {
    await helpers.executeString(`
      const value: Array<unknown> = [];
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('boolean true', async () => {
    await helpers.executeString(`
      const value = true;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('boolean false', async () => {
    await helpers.executeString(`
      const value = false;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('buffer', async () => {
    await helpers.executeString(`
      const value: Buffer = Buffer.from('', 'hex');
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('null', async () => {
    await helpers.executeString(`
      const value = null;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, bad);
    `);
  });

  test('number 0', async () => {
    await helpers.executeString(`
      const value = 0;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('number 1', async () => {
    await helpers.executeString(`
      const value = 1;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('object', async () => {
    await helpers.executeString(`
      const value: { [key: string]: string } = {};
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('string ""', async () => {
    await helpers.executeString(`
      const value: string = '';
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('string "a"', async () => {
    await helpers.executeString(`
      const value: string = 'a';
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('symbol', async () => {
    await helpers.executeString(`
      const value: symbol = Symbol.for('a');
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('undefined', async () => {
    await helpers.executeString(`
      const value: undefined = undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, bad);
    `);
  });

  test('array or undefined', async () => {
    await helpers.executeString(`
      const value: Array<number> | undefined = [] as Array<number> | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('boolean or undefined true', async () => {
    await helpers.executeString(`
      const value: boolean | undefined = true as boolean | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('boolean or undefined false', async () => {
    await helpers.executeString(`
      const value: boolean | undefined = false as boolean | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('buffer or undefined', async () => {
    await helpers.executeString(`
      const value: Buffer | undefined = Buffer.from('', 'hex') as Buffer | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('null or undefined', async () => {
    await helpers.executeString(`
      const value: null | undefined = null as null | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, bad);
    `);
  });

  test('number or undefined 0', async () => {
    await helpers.executeString(`
      const value: number | undefined = 0 as number | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('number or undefined 1', async () => {
    await helpers.executeString(`
      const value: number | undefined = 1 as number | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('object or undefined', async () => {
    await helpers.executeString(`
      const value: { [key: string]: string } | undefined = {} as { [key: string]: string } | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('string or undefined ""', async () => {
    await helpers.executeString(`
      const value: string | undefined = '' as string | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('string or undefined "a"', async () => {
    await helpers.executeString(`
      const value: string | undefined = 'a' as string | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('symbol or undefined', async () => {
    await helpers.executeString(`
      const value: symbol | undefined = Symbol.for('a') as symbol | undefined;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('array or object', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } = [] as Array<number> | { [key: string]: number };
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });

  test('array or object or number', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } | number = [] as Array<number> | { [key: string]: number } | number;
      const bad = 'bad';
      const result = value ?? bad;

      assertEqual(result, value);
    `);
  });
});
