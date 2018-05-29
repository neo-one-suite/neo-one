import { helpers } from '../../../__data__';

describe('BinaryExpressionCompiler', () => {
  test('x = 3', async () => {
    await helpers.executeString(`
      let x = 3;
      if (x !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('x += 3 [PlusEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      if ((x += 3) !== 6) {
        throw 'Failure';
      }
    `);
  });

  test('x -= 3 [MinusEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x -= 3;
      if (x !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('x *= 3 [AsteriskEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x *= 3;
      if (x !== 9) {
        throw 'Failure';
      }
    `);
  });

  test('x /= 3 [SlashEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x /= 3;
      if (x !== 1) {
        throw 'Failure';
      }
    `);
  });

  test.skip('x **= 3 [AsteriskAsteriskEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x **= 3;
      if (x !== 27) {
        throw 'Failure';
      }
    `);
  });

  test('3 % 3 === 0 [PercentToken]', async () => {
    await helpers.executeString(`
      if (3 % 3 !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('4 % 3 === 1 [PercentToken]', async () => {
    await helpers.executeString(`
      if (4 % 3 !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('x %= 3 [PercentEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 3;
      x %= 3;
      if (x !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('x &= 0b001 [AmpersandEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x &= 0b001;
      if (x !== 0b001) {
        throw 'Failure';
      }
    `);
  });

  test('x |= 0b100 [BarEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x |= 0b100;
      if (x !== 0b111) {
        throw 'Failure';
      }
    `);
  });

  test('x ^= 0b100 [CaretEqualsToken]', async () => {
    await helpers.executeString(`
      let x = 0b011;
      x ^= 0b110;
      if (x !== 0b101) {
        throw 'Failure';
      }
    `);
  });

  test.skip('x <<= 1 [LessThanLessThanEqualsToken]', async () => {
    await helpers.executeString(`
        let x = 0b011;
        x <<= 1;
        if (x !== 0b110) {
          throw 'Failure';
        }
      `);
  });

  test.skip('x >>= 1 [GreaterThanGreaterThanEqualsToken]', async () => {
    await helpers.executeString(`
        let x = 0b011;
        x >>= 1;
        if (x !== 0b001) {
          throw 'Failure';
        }
      `);
  });

  test('1 * 2 == 2 [AsteriskToken]', async () => {
    await helpers.executeString(`
      if (1 * 2 !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('4 / 2 == 2 [SlashToken]', async () => {
    await helpers.executeString(`
      if (4 / 2 !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('4 % 3 == 1 [PercentToken]', async () => {
    await helpers.executeString(`
      if (4 % 3 !== 1) {
        throw 'Failure';
      }
    `);
  });

  test('1 + 2 === 3 [PlusToken:binaryNumeric]', async () => {
    await helpers.executeString(`
      if (1 + 2 !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('"1" + "2" === "12" [PlusToken:StringConcatenation:StrBoth]', async () => {
    await helpers.executeString(`
      if ('1' + '2' !== '12') {
        throw 'Failure';
      }
    `);
  });

  test.skip('1 + "3" === "13" [PlusToken:StringConcatenation:IntLeftStrRight]', async () => {
    await helpers.executeString(`
      if ('1' + '3' !== '13') {
        throw 'Failure';
      }
    `);
  });

  test.skip('"4" + 2 === "42" [PlusToken:StringConcatenation:StrLeftIntRight]', async () => {
    await helpers.executeString(`
      if ('4' + 2 !== '42') {
        throw 'Failure';
      }
    `);
  });

  test('1 - 2 = -1 [MinusToken]', async () => {
    await helpers.executeString(`
      if (1 - 2 !== -1) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(224 >>> 2) == 56 [GreaterThanGreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((224 >>> 2) !== 56) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(128 >> 2) == 32 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((128 >> 2) !== 32) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(-234 >> 2) == -59 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((-234 >> 2) !== -59) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(128 >> 2) == 32 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((128 >> 2) !== 32) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(256 >> -2) == 0 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((256 >> -2) !== 0) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(-256 >> -2) == -1 [GreaterThanGreaterThanToken]', async () => {
    await helpers.executeString(`
      if ((-256 >> -2) !== -1) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(32 << 2) == 128 [LessThanLessThanToken]', async () => {
    await helpers.executeString(`
      if ((32 << 2) !== 128) {
        throw 'Failure';
      }
    `);
  });

  test.skip('(-24 << 2) == 96 [LessThanLessThanToken]', async () => {
    await helpers.executeString(`
      if ((-24 << 2) !== 96)  {
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

  test('true && true [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (!(true && true)) {
        throw 'Failure';
      }
    `);
  });

  test('true && false [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (true && false) {
        throw 'Failure';
      }
    `);
  });

  test('!(false && true) [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (false && true) {
        throw 'Failure';
      }
    `);
  });

  test('false && false [AmpersandAmpersandToken]', async () => {
    await helpers.executeString(`
      if (false && false) {
        throw 'Failure';
      }
    `);
  });

  test('false && short-circuit [AmpersandAmpersandToken:short-circuit]', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      if (false && fail()) {
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

  test('true || true [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(true || true)) {
        throw 'Failure';
      }
    `);
  });

  test('true || false [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(true || false)) {
        throw 'Failure';
      }
    `);
  });

  test('false || true [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(false || true)) {
        throw 'Failure';
      }
    `);
  });

  test('false || false [BarBarToken]', async () => {
    await helpers.executeString(`
      if (false || false) {
        throw 'Failure';
      }
    `);
  });

  test('true || short-circuit [BarBarToken]', async () => {
    await helpers.executeString(`
      const fail = () => {
        throw 'Failure';
      };

      if (!(true || fail())) {
        throw 'Failure';
      }
    `);
  });

  test('1 || 0 [BarBarToken]', async () => {
    await helpers.executeString(`
      if (!(1 || 0 === 1)) {
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
      if (true == false) {
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

  test.skip('!(0 == null) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 == null) {
        throw 'Failure';
      }
    `);
  });

  test('0 == false [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(0 == false)) {
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

  test.skip('!(true == undefined) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (true == undefined) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(false == "a") [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false == "a")) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(null == true) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == true) {
        throw 'Failure';
      }
    `);
  });

  test.skip('!(null == false) [EqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (null == false) {
        throw 'Failure';
      }
    `);
  });

  test.skip('true != null [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(true != null)) {
        throw 'Failure';
      }
    `);
  });

  test.skip('true != undefined [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(true != undefined)) {
        throw 'Failure';
      }
    `);
  });

  test('4 != 3 [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(4 != 3)) {
        throw 'Failure';
      }
    `);
  });

  test('0 != 3 [ExclamationEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(0 != 3)) {
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

  test('0 === false [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 === false) {
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

  test('0 === "a" [EqualsEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (0 === "a") {
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

  test('"a" !== true [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!("a" !== true)) {
        throw 'Failure';
      }
    `);
  });

  test('false !== true [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false !== true)) {
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

  test('false !== 0 [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(false !== 0)) {
        throw 'Failure';
      }
    `);
  });

  test('4 !== -4 [ExclamationEqualsEqualsToken]', async () => {
    await helpers.executeString(`
      if (!(4 !== -4)) {
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
