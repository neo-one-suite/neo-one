import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test('true != null [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(true != null)) {
        throw 'Failure';
      }
    `);
  });

  test('true != undefined [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(true != undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('4 != 3 [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      const x: number = 4;
      if (!(x != 3)) {
        throw 'Failure';
      }
    `);
  });

  test('0 != 3 [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      const x: number = 0;
      if (!(x != 3)) {
        throw 'Failure';
      }
    `);
  });

  test('undefined != "a" [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      const a: string | undefined = undefined as string | undefined;
      const b: string | undefined = 'a' as string | undefined;
      assertEqual(a != b, true);
    `);
  });

  test('1 > 1 [GreaterThanToken]', async () => {
    await helpers.executeString(`
      if (1 > 1) {
        throw 'Failure';
      }
    `);
  });

  test('!(2 > 1) [GreaterThanToken]', async () => {
    await helpers.executeString(`
      if (!(2 > 1)) {
        throw 'Failure';
      }
    `);
  });

  test('1 >= 2 [GreaterThanEqualsToken]', async () => {
    await helpers.executeString(`
      if (1 >= 2) {
        throw 'Failure';
      }
    `);
  });

  test('!(2 >= 2) [GreaterThanEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(2 >= 2)) {
        throw 'Failure';
      }
    `);
  });

  test('false && short-circuit [AmpersandAmpersandToken:short-circuit]', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      const x: boolean = false as boolean;
      if (x && fail()) {
        throw 'Failure';
      }
    `);
  });

  test('(0 && true) === 0 [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (!((0 && true) === 0)) {
        throw 'Failure';
      }
    `);
  });

  test('( true && 3 ) === 3 [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (!(true && 3 === 3)) {
        throw 'Failure';
      }
    `);
  });

  test('1 < 1 [LessThanToken]', async () => {
    await helpers.executeString(`
      if (1 < 1) {
        throw 'Failure';
      }
    `);
  });

  test('!(1 < 2) [LessThanToken]', async () => {
    await helpers.executeString(`
      if (!(1 < 2)) {
        throw 'Failure';
      }
    `);
  });

  test('!(2 <= 1) [LessThanEqualsToken]', async () => {
    await helpers.executeString(`
      if (2 <= 1) {
        throw 'Failure';
      }
    `);
  });

  test('2 <= 2 [LessThanEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(2 <= 2)) {
        throw 'Failure';
      }
    `);
  });
});
