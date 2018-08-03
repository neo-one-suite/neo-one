import { helpers } from '../../../../../__data__';

describe('ToBooleanHelper', () => {
  test('array', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      if ([]) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('boolean true', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: boolean = true;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('boolean false', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: boolean = false;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('buffer', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: Buffer = Buffer.from('', 'hex');
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('null', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: null = null;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('number 0', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: number = 0;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('number 1', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: number = 1;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('object', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: { [key: string]: string } = {};
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('string ""', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: string = '';
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('string "a"', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: string = 'a';
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('symbol', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: symbol = Symbol.for('a');
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: undefined = undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('array or undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: Array<number> | undefined = [] as Array<number> | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('boolean or undefined true', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: boolean | undefined = true as boolean | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('boolean or undefined false', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: boolean | undefined = false as boolean | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('buffer or undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: Buffer | undefined = Buffer.from('', 'hex') as Buffer | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('null or undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: null | undefined = null as null | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('number or undefined 0', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: number | undefined = 0 as number | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('number or undefined 1', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: number | undefined = 1 as number | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('object or undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: { [key: string]: string } | undefined = {} as { [key: string]: string } | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('string or undefined ""', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: string | undefined = '' as string | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, false);
    `);
  });

  test('string or undefined "a"', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: string | undefined = 'a' as string | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('symbol or undefined', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: symbol | undefined = Symbol.for('a') as symbol | undefined;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('array or object', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: Array<number> | { [key: string]: number } = [] as Array<number> | { [key: string]: number };
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });

  test('array or object or number', async () => {
    await helpers.executeString(`
      let isTruthy = false;
      const value: Array<number> | { [key: string]: number } | number = [] as Array<number> | { [key: string]: number } | number;
      if (value) {
        isTruthy = true;
      }

      assertEqual(isTruthy, true);
    `);
  });
});
