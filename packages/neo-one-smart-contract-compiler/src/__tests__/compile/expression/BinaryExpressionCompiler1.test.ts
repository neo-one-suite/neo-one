import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test('true || short-circuit [BarBarToken]', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      const x: boolean = true as boolean;
      if (!(x || fail())) {
        throw 'Failure';
      }
    `);
  });

  test('1 || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      const x: number = 1 || 0;
      if (!(x === 1)) {
        throw 'Failure';
      }
    `);
  });

  test('false || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(false || 0 === 0)) {
        throw 'Failure';
      }
    `);
  });

  test('undefined || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      if ((undefined || 0) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('!(true == false) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      const x: boolean = true as boolean;
      if (x == false) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(undefined == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (undefined == "a") {
        throw 'Failure';
      }
    `);
  });

  test('!(0 == null) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 == null) {
        throw 'Failure';
      }
    `);
  });

  test('null == undefined [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(null == undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('!(true == undefined) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (true == undefined) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(false == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false == "a")) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(false == "") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false == "")) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(false == " ")  [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false == " ")) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(false == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (false == "a") {
        throw 'Failure';
      }
    `);
  });

  test.skip('(3 == "3") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(3 == "3")) {
        throw 'Failure';
      }
    `);
  });

  test('!(null == true) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == true) {
        throw 'Failure';
      }
    `);
  });

  test('!(null == false) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == false) {
        throw 'Failure';
      }
    `);
  });

  test('null == undefined [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(null == undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('null !== true [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == true) {
        throw 'Failure';
      }
    `);
  });

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

  test.skip('0 != "a" [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(0 != "a")) {
        throw 'Failure';
      }
    `);
  });

  test.skip('undefined != "a" [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(undefined != "a")) {
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

  test.skip('(127 ^ 2) === 125 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((127 ^ 2) !== 125) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(127 ^ -6) === -123 [CaretToken]', async () => {
    await helpers.executeString(`
      if ((127 ^ -6) !== -123) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(128 ^ 5) === 133 [CaretToken]', async () => {
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
