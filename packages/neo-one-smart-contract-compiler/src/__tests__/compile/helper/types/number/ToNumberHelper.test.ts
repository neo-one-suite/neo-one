import { helpers } from '../../../../../__data__';

describe('ToNumberHelper', () => {
  test('array', async () => {
    await helpers.executeString(`
      const value: Array<number> = [0, 1, 2];

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('boolean true', async () => {
    await helpers.executeString(`
      const value: boolean = true;

      assertEqual(+value, 1);
    `);
  });

  test('boolean false', async () => {
    await helpers.executeString(`
      const value: boolean = false;

      assertEqual(+value, 0);
    `);
  });

  test('buffer', async () => {
    await helpers.executeString(`
      const value: Buffer = Buffer.from('', 'hex');

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('null', async () => {
    await helpers.compileString(
      `
      const value: null = null;

      assertEqual(+value, 0);
    `,
      { type: 'error' },
    );
  });

  test('number 0', async () => {
    await helpers.executeString(`
      const value: number = 0;

      assertEqual(+value, 0);
    `);
  });

  test('number 1', async () => {
    await helpers.executeString(`
      const value: number = 1;

      assertEqual(+value, 1);
    `);
  });

  test('object', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } = {};

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('object toString', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } = {
        toString() {
          return '0';
        }
      };

      assertEqual(+value, 0);
    `);
  });

  test('object valueOf', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => number } = {
        valueOf() {
          return 0;
        }
      };

      assertEqual(+value, 0);
    `);
  });

  test('string ""', async () => {
    await helpers.executeString(`
      const value: string = '';

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('string "a"', async () => {
    await helpers.executeString(`
      const value: string = 'a';

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('string "4321"', async () => {
    await helpers.executeString(`
      const value: string = '4321';

      assertEqual(+value, 4321);
    `);
  });

  test('string "0,1,2"', async () => {
    await helpers.executeString(`
      const value: string = '0,1,2';

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('symbol', async () => {
    await helpers.compileString(
      `
      +Symbol.for('a');
    `,
      { type: 'error' },
    );
  });

  test('undefined', async () => {
    await helpers.compileString(
      `
      const value: undefined = undefined;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `,
      { type: 'error' },
    );
  });

  test('array or number', async () => {
    await helpers.executeString(`
      const value: Array<number> | number = [0] as Array<number> | number;

      assertEqual(+value, 0);
    `);
  });

  test('boolean or number true', async () => {
    await helpers.executeString(`
      const value: boolean | number = true as boolean | number;

      assertEqual(+value, 1);
    `);
  });

  test('boolean or number false', async () => {
    await helpers.executeString(`
      const value: boolean | number = false as boolean | number;

      assertEqual(+value, 0);
    `);
  });

  test('buffer or number', async () => {
    await helpers.executeString(`
      const value: Buffer | number = Buffer.from('', 'hex') as Buffer | number;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('null or number', async () => {
    await helpers.compileString(
      `
      const value: null | number = null as null | number;

      assertEqual(+value, 0);
    `,
      { type: 'error' },
    );
  });

  test('number or string 0', async () => {
    await helpers.executeString(`
      const value: number | string = 0 as number | string;

      assertEqual(+value, 0);
    `);
  });

  test('number or number 1', async () => {
    await helpers.executeString(`
      const value: number | string = 1 as number | string;

      assertEqual(+value, 1);
    `);
  });

  test('object or number', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } | number = {} as { [key: string]: () => string } | number;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('object or number toString', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => string } | number = {
        toString() {
          return '0';
        }
      } as { [key: string]: () => string } | number;

      assertEqual(+value, 0);
    `);
  });

  test('object or number valueOf', async () => {
    await helpers.executeString(`
      const value: { [key: string]: () => number } | number = {
        valueOf() {
          return 0;
        }
      } as { [key: string]: () => number } | number;

      assertEqual(+value, 0);
    `);
  });

  test('string or number ""', async () => {
    await helpers.executeString(`
      const value: string | number = '' as string | number;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('string or number "a"', async () => {
    await helpers.executeString(`
      const value: string | number = 'a' as string | number;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('string or number "4321"', async () => {
    await helpers.executeString(`
      const value: string | number = '4321' as string | number;

      assertEqual(+value, 4321);
    `);
  });

  test('string or number "0,1,2"', async () => {
    await helpers.executeString(`
      const value: string | number = '0,1,2' as string | number;

      let error: string | undefined;
      try {
        +value;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `);
  });

  test('array or object', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } = [0] as Array<number> | { [key: string]: number };

      assertEqual(+value, 0);
    `);
  });

  test('array or object or number', async () => {
    await helpers.executeString(`
      const value: Array<number> | { [key: string]: number } | number = [0] as Array<number> | { [key: string]: number } | number;

      assertEqual(+value, 0);
    `);
  });
});
