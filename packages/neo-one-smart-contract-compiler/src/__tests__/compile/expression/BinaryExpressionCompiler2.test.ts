import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test.skip('+ with object toPrimitive number', async () => {
    await helpers.executeString(`
      const sym = Symbol.toPrimitive;
      const x = {};
      x[sym] = () => 1;
      const y = {};
      y[sym] = () => 2;

      if (x + y !== 3) {
        throw 'Failure';
      }
    `);
  });

  test.skip('+ with object toPrimitive string', async () => {
    await helpers.executeString(`
      const sym = Symbol.toPrimitive;
      const x = {};
      x[sym] = () => '1';
      const y = {};
      y[sym] = () => '2';

      if (x + y !== '12') {
        throw 'Failure';
      }
    `);
  });

  test('1, 2', async () => {
    await helpers.executeString(`
      const foo = () => 1;
      const x = (foo(), 2);

      if (x !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('(6 & 5) === 4 [AmpersandToken]', async () => {
    await helpers.executeString(`
      if ((6 & 5) !== 4) {
        throw 'Failure';
      }
    `);
  });

  test('(12 & 10) === 8 [AmpersandToken]', async () => {
    await helpers.executeString(`
      if ((12 & 10) !== 8) {
        throw 'Failure';
      }
    `);
  });

  test('(128 & 2) === 0 [AmpersandToken]', async () => {
    await helpers.executeString(`
      if ((128 & 2) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('(3 | 6) === 7 [BarToken]', async () => {
    await helpers.executeString(`
      if ((3 | 6) !== 7) {
        throw 'Failure';
      }
    `);
  });

  test('(19 | -3) === -1 [BarToken]', async () => {
    await helpers.executeString(`
      if ((19 | -3) !== -1) {
        throw 'Failure';
      }
    `);
  });

  test('(5 ^ 2) === 7 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((5 ^ 2) !== 7) {
        throw 'Failure';
      }
    `);
  });

  test('(127 ^ 2) === 125 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((127 ^ 2) !== 125) {
        throw 'Failure';
      }
    `);
  });

  test('(127 ^ -6) === -123 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((127 ^ -6) !== -123) {
        throw 'Failure';
      }
    `);
  });

  test('(128 ^ 5) === 133 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((128 ^ 5) !== 133) {
        throw 'Failure';
      }
    `);
  });

  test('true === true [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(true === true)) {
        throw 'Failure';
      }
    `);
  });

  test('!(false === null) [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (false === null) {
        throw 'Failure';
      }
    `);
  });

  test('!(undefined === null) [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (undefined === null) {
        throw 'Failure';
      }
    `);
  });

  test('!(undefined === false) [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (undefined === false) {
        throw 'Failure';
      }
    `);
  });

  test('!(0 === null) [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 === null) {
        throw 'Failure';
      }
    `);
  });

  test('false === false [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (false !== false) {
        throw 'Failure';
      }
    `);
  });

  test('false !== true [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const x: boolean = false as boolean;
      if (!(x !== true)) {
        throw 'Failure';
      }
    `);
  });

  test('false !== null [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false !== null)) {
        throw 'Failure';
      }
    `);
  });

  test('4 !== -4 [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const x: number = 4 as number;
      if (!(x !== -4)) {
        throw 'Failure';
      }
    `);
  });

  test('!(42 !== 42) [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (42 !== 42) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(3 ** 2) == 9 [AsteriskAsteriskToken]', async () => {
    await helpers.executeString(`
      if ((3 ** 2) != 9) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(10 ** -2) == 0.01 [AsteriskAsteriskToken]', async () => {
    await helpers.executeString(`
      if ((10 ** -2) != 0.01) {
        throw 'Failure';
      }
    `);
  });

  test('dog instanceof Animal [InstanceOfKeyword]', async () => {
    await helpers.executeString(`
      class Animal {};
      let dog = new Animal();
      if (!(dog instanceof Animal)) {
        throw 'Failure';
      }
    `);
  });

  test.skip('memory in computer [InKeyword]', async () => {
    await helpers.executeString(`
    let computer = {cpu: 'i7', memory:'64gb', storage:'1tb'};
      if (!('cpu' in computer)) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!("nic" in computer) [InKeyword]', async () => {
    await helpers.executeString(`
    let computer = {cpu: 'i7', memory:'64gb', storage:'1tb'};
      if ('nic' in computer) {
        throw 'Failure';
      }
    `);
  });
});
